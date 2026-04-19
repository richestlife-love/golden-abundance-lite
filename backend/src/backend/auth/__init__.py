"""Authentication helpers: HS256 JWT + stub Google ID-token verifier.

Real Google JWKS verification lands in Phase 6; in Phase 5 the stub
treats the raw id_token as the authenticated email address.
"""
