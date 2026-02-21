import discord
from discord.ext import commands
import config

class Onboarding(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        if not config.WELCOME_ENABLED or not config.WELCOME_CHANNEL_ID:
            return

        channel = self.bot.get_channel(int(config.WELCOME_CHANNEL_ID))
        if not channel:
            print(f"Onboarding Error: Could not find welcome channel with ID {config.WELCOME_CHANNEL_ID}")
            return

        # Format the message
        welcome_text = config.WELCOME_MESSAGE.replace("{user}", member.mention).replace("{server}", member.guild.name)
        
        try:
            await channel.send(welcome_text)
        except Exception as e:
            print(f"Onboarding Error: Failed to send welcome message: {e}")

async def setup(bot: commands.Bot):
    await bot.add_cog(Onboarding(bot))
