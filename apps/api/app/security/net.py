"""Client IP handling. IPs are only ever stored as salted hashes."""

import hashlib

from fastapi import Request

from ..config import get_settings


def client_ip(request: Request) -> str:
    if get_settings().trust_proxy:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def hash_value(value: str) -> str:
    salt = get_settings().ip_hash_salt
    return hashlib.sha256(f"{salt}:{value}".encode()).hexdigest()


def ip_hash(request: Request) -> str:
    return hash_value(client_ip(request))
