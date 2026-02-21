import discord
from discord.ext import commands
from discord import app_commands
import db as database
from utils.permissions import has_command_permission

class Prompts(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    prompt_group = app_commands.Group(
        name="prompt", 
        description="Manage channel-specific AI personalities",
        default_permissions=discord.Permissions(manage_channels=True)
    )

    @prompt_group.command(name="set", description="Set a custom system prompt for this channel")
    @app_commands.describe(text="The system prompt defining the AI personality for this channel")
    @has_command_permission()
    async def set_prompt(self, interaction: discord.Interaction, text: str):
        await database.set_channel_prompt(str(interaction.channel_id), str(interaction.guild_id), text)
        await interaction.response.send_message(
            f"✅ Custom system prompt set for this channel.
**Preview:** {text[:100]}...", 
            ephemeral=True
        )

    @prompt_group.command(name="reset", description="Reset to the global default system prompt")
    @has_command_permission()
    async def reset_prompt(self, interaction: discord.Interaction):
        await database.delete_channel_prompt(str(interaction.channel_id))
        await interaction.response.send_message("✅ Reset to global default system prompt.", ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Prompts(bot))
