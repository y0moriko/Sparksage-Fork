from __future__ import annotations
import config
import providers
import db as database

MAX_HISTORY = 20


async def get_history(channel_id: int) -> list[dict]:
    """Get conversation history for a channel from the database."""
    messages = await database.get_messages(str(channel_id), limit=MAX_HISTORY)
    return [{"role": m["role"], "content": m["content"]} for m in messages]


async def ask_ai(channel_id: int, user_name: str, message: str) -> tuple[str, str]:
    """Send a message to AI and return (response, provider_name)."""
    # Store user message in DB
    await database.add_message(str(channel_id), "user", f"{user_name}: {message}")

    history = await get_history(channel_id)

    try:
        response, provider_name = providers.chat(history, config.SYSTEM_PROMPT)
        # Store assistant response in DB
        await database.add_message(str(channel_id), "assistant", response, provider=provider_name)
        return response, provider_name
    except RuntimeError as e:
        return f"Sorry, all AI providers failed:
{e}", "none"
