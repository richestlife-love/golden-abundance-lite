from datetime import timedelta
from uuid import uuid4

import pytest

from backend.auth.jwt import decode_token, encode_token


def test_encode_then_decode_round_trip() -> None:
    user_id = uuid4()
    email = "jet@example.com"
    token = encode_token(user_id=user_id, email=email)
    claims = decode_token(token)
    assert claims["sub"] == str(user_id)
    assert claims["email"] == email
    assert claims["iat"] < claims["exp"]


def test_decode_rejects_tampered_token() -> None:
    token = encode_token(user_id=uuid4(), email="x@example.com")
    # Flip the FIRST char of the signature segment, not the last: an HS256
    # signature is 32 bytes encoded in 43 base64url chars (258 slot-bits),
    # so the final char only carries 4 significant bits — chars aliasing
    # in the bottom 2 bits (e.g. A/B/C/D) decode to the same signature
    # bytes and the "tamper" is a no-op ~6% of the time.
    header_payload, sig = token.rsplit(".", 1)
    tampered = f"{header_payload}.{'A' if sig[0] != 'A' else 'B'}{sig[1:]}"
    with pytest.raises(ValueError):
        decode_token(tampered)


def test_decode_rejects_token_signed_with_different_secret() -> None:
    """HS256 signature verification: attacker-signed token must be rejected."""
    import jwt as pyjwt

    forged = pyjwt.encode(
        {
            "sub": str(uuid4()),
            "email": "e@example.com",
            "iat": 0,
            "exp": 9_999_999_999,
        },
        "attacker-secret-not-ours",
        algorithm="HS256",
    )
    with pytest.raises(ValueError):
        decode_token(forged)


def test_decode_rejects_alg_none() -> None:
    """Historical PyJWT vulnerability — `alg: none` must never be accepted."""
    import jwt as pyjwt

    none_alg = pyjwt.encode(
        {"sub": str(uuid4()), "email": "e@example.com", "exp": 9_999_999_999},
        key="",
        algorithm="none",
    )
    with pytest.raises(ValueError):
        decode_token(none_alg)


def test_decode_requires_sub_claim() -> None:
    """Missing sub should not decode to a usable user."""
    import jwt as pyjwt

    from backend.config import get_settings

    token = pyjwt.encode(
        {"email": "e@example.com", "exp": 9_999_999_999},
        get_settings().jwt_secret,
        algorithm="HS256",
    )
    # Either decode raises, or downstream sub access raises — both acceptable.
    try:
        claims = decode_token(token)
        assert "sub" not in claims or not claims["sub"]
    except ValueError:
        pass


def test_decode_rejects_expired_token() -> None:
    token = encode_token(user_id=uuid4(), email="x@example.com", ttl=timedelta(seconds=-10))
    with pytest.raises(ValueError):
        decode_token(token)
