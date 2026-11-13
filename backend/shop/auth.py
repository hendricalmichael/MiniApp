from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model

TOKEN_DAYS = 7


def create_token(user) -> str:
    """Make a signed token that says 'this is user <id>' and expires in 7 days."""
    payload = {
        "sub": str(user.pk),
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def get_user(request):
    """Read 'Authorization: Bearer <token>' and return the user, or None."""
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        data = jwt.decode(header[7:], settings.SECRET_KEY, algorithms=["HS256"])
        return get_user_model().objects.filter(pk=int(data["sub"]), is_active=True).first()
    except (jwt.PyJWTError, KeyError, ValueError):
        return None