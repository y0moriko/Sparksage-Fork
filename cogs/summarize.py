from discord.ext import commands
from discord import app_commands
import discord
from utils.bot_utils import ask_ai, get_history

class Summarize(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="summarize", description="Summarize the recent conversation in this channel")
    async def summarize(self, interaction: discord.Interaction):
        await interaction.response.defer()
        history = await get_history(interaction.channel_id)
        if not history:
            await interaction.followup.send("No conversation history to summarize.")
            return

        summary_prompt = "Please summarize the key points from this conversation so far in a concise bullet-point format."
        response, provider_name = await ask_ai(
            interaction.channel_id, interaction.user.display_name, summary_prompt
        )
        await interaction.followup.send(f"**Conversation Summary:**
{response}")

async def setup(bot: commands.Bot):
    await bot.add_cog(Summarize(bot))
