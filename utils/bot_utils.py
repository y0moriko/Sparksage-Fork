from __future__ import annotations
import config
import providers
import db as database

MAX_HISTORY = 20


async def get_history(channel_id: int) -> list[dict]:
    """Get conversation history for a channel from the database."""
    messages = await database.get_messages(str(channel_id), limit=MAX_HISTORY)
    return [{"role": m["role"], "content": m["content"]} for m in messages]


async def ask_ai(
    channel_id: int, 
    user_name: str, 
    message: str, 
    system_prompt: str | None = None,
    category: str | None = None
) -> tuple[str, str]:
    """Send a message to AI and return (response, provider_name)."""
    # Check for channel-specific prompt
    channel_prompt = await database.get_channel_prompt(str(channel_id))
    
    # Store user message in DB
    await database.add_message(str(channel_id), "user", f"{user_name}: {message}", category=category)

    history = await get_history(channel_id)
    
    # Priority: 
    # 1. Parameter system_prompt (from specialized cogs like code review)
    # 2. Database channel_prompt
    # 3. Global config system prompt
    prompt = system_prompt or channel_prompt or config.SYSTEM_PROMPT

    try:
        response, provider_name = providers.chat(history, prompt)
        # Store assistant response in DB
        await database.add_message(str(channel_id), "assistant", response, provider=provider_name, category=category)
        return response, provider_name
    except RuntimeError as e:
        return f"Sorry, all AI providers failed:\n{e}", "none"
