"""Upgrade all 3rd-party deps to the latest versions.

Parses pyproject.toml, removes then re-adds every package (without a version
pin) so uv resolves the latest. Respects extras and dependency groups.
"""

import re
import subprocess
import sys
import tomllib
from pathlib import Path

B = "\033[1m"
C = "\033[36m"
G = "\033[32m"
E = "\033[1;31m"
R = "\033[0m"


def _norm(name: str) -> str:
    """PEP 503 normalize a package name."""
    return re.sub(r"[-_.]+", "_", name).lower()


def parse_dep(spec: str) -> tuple[str, str]:
    """Return (base_name, name_with_extras) from a PEP 508 string."""
    m = re.match(r"([a-zA-Z0-9_.-]+)(\[[^\]]+\])?", spec.strip())
    if not m:
        raise ValueError(f"unparseable dep: {spec}")
    return m.group(1), m.group(1) + (m.group(2) or "")


def collect_sections(path: Path) -> list[tuple[str, str, list[str], list[str]]]:
    """Return [(kind, qualifier, [remove], [add])] for a pyproject.toml."""
    with path.open("rb") as f:
        data = tomllib.load(f)

    sections: list[tuple[str, str, list[str], list[str]]] = []

    def process(kind: str, qualifier: str, deps: list[str]) -> None:
        rm, add = [], []
        for d in deps:
            base, full = parse_dep(d)
            rm.append(base)
            add.append(full)
        if rm:
            sections.append((kind, qualifier, rm, add))

    process("deps", "", data.get("project", {}).get("dependencies", []))

    for grp, pkgs in data.get("dependency-groups", {}).items():
        if isinstance(pkgs, list):
            process("group", grp, [p for p in pkgs if isinstance(p, str)])

    return sections


class UvError(Exception):
    pass


class DepsChangedError(Exception):
    pass


def _label(kind: str, qualifier: str) -> str:
    match kind:
        case "deps":
            return "dependencies"
        case "group":
            return f"group [{qualifier}]"
        case _:
            raise ValueError(f"unknown section kind: {kind}")


def _flags(kind: str, qualifier: str) -> list[str]:
    match kind:
        case "deps":
            return []
        case "group":
            return ["--group", qualifier]
        case _:
            raise ValueError(f"unknown section kind: {kind}")


def uv(*args: str, cwd: Path) -> None:
    result = subprocess.run(["uv", *args], cwd=cwd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise UvError(result.stderr)


def get_dep_names(sections: list[tuple[str, str, list[str], list[str]]]) -> dict[str, set[str]]:
    """Return {section_label: {normalized_dep_names}} from collect_sections output."""
    return {_label(kind, qual): {_norm(n) for n in rm} for kind, qual, rm, _ in sections}


def verify_deps_unchanged(before: dict[str, set[str]], after: dict[str, set[str]]) -> None:
    """Raise DepsChangedError if any packages were added or removed."""
    problems: list[str] = []
    for section in sorted(before.keys() | after.keys()):
        b = before.get(section, set())
        a = after.get(section, set())
        if added := a - b:
            problems.append(f"  {section}: added {', '.join(sorted(added))}")
        if removed := b - a:
            problems.append(f"  {section}: removed {', '.join(sorted(removed))}")
    if problems:
        raise DepsChangedError("package list changed (expected only version bumps):\n" + "\n".join(problems))


def upgrade_project(project_dir: Path) -> None:
    pyproject = project_dir / "pyproject.toml"
    print(f"{B}==> Upgrading {C}{project_dir.name}{R}")

    sections = collect_sections(pyproject)
    if not sections:
        print("  No deps to upgrade")
        return

    before = get_dep_names(sections)

    lock = project_dir / "uv.lock"
    pyproject_backup = pyproject.read_bytes()
    lock_backup = lock.read_bytes() if lock.exists() else None

    try:
        for kind, qualifier, rm_pkgs, add_pkgs in sections:
            print(f"  {G}{_label(kind, qualifier)}{R}: {' '.join(rm_pkgs)}")
            uv("remove", *_flags(kind, qualifier), *rm_pkgs, cwd=project_dir)
            uv("add", *_flags(kind, qualifier), *add_pkgs, cwd=project_dir)

        after = get_dep_names(collect_sections(pyproject))
        verify_deps_unchanged(before, after)
    except UvError, DepsChangedError:
        pyproject.write_bytes(pyproject_backup)
        if lock_backup is not None:
            lock.write_bytes(lock_backup)
        raise


def main() -> None:
    # src/backend/scripts/upgrade_deps.py → project root at parents[3].
    root = Path(__file__).resolve().parents[3]
    try:
        upgrade_project(root)
    except (UvError, DepsChangedError) as e:
        print(f"{E}==> Failed{R}\n{e}", file=sys.stderr, end="")
        raise SystemExit(1) from e

    print(f"\n{B}Done.{R} Verify only version pins changed in {C}pyproject.toml{R} / {C}uv.lock{R} diffs.")


if __name__ == "__main__":
    main()
