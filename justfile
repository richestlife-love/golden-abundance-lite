default: serve

# Serve the design prototype on http://localhost:{{port}}
serve port="8000":
    uv run --no-project python -m http.server {{port}} --directory frontend

# Expose local port 8000 (https) via a reserved ngrok hostname
tunnel:
    ngrok http --url=subvitalized-occupative-katelyn.ngrok-free.dev --scheme=https 8000

# Validate example JSON fixtures against the Pydantic contract models
contract-validate:
    cd backend && uv run python -m backend.contract.validate_examples
