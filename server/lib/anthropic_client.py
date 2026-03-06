"""
Anthropic Claude client for summary evaluation.

Returns a shared anthropic.Anthropic instance configured from Django settings.
Pattern mirrors server/lib/olmo_client.py.
"""

import anthropic
from django.conf import settings

_client: anthropic.Anthropic | None = None


def get_anthropic_client() -> anthropic.Anthropic:
    """Return a shared Anthropic client, creating it on first call."""
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client
