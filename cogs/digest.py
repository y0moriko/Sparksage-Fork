import discord
from discord.ext import commands, tasks
from discord import app_commands
import config
import providers
import datetime
import asyncio
from utils.permissions import has_command_permission

class Digest(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.last_run_date = None
        self.daily_digest.start()

    def cog_unload(self):
        self.daily_digest.cancel()

    digest_group = app_commands.Group(
        name="digest", 
        description="Manage daily server summaries",
        default_permissions=discord.Permissions(manage_guild=True)
    )

    @digest_group.command(name="run", description="Manually trigger the daily digest summary")
    @has_command_permission()
    async def run_manual_digest(self, interaction: discord.Interaction):
        if not config.DIGEST_CHANNEL_ID:
            await interaction.response.send_message("Error: Digest channel ID is not configured in settings.", ephemeral=True)
            return

        await interaction.response.send_message("Starting manual digest generation...", ephemeral=True)
        await self.run_digest()

    @tasks.loop(minutes=1)
    async def daily_digest(self):
        try:
            if not config.DIGEST_ENABLED or not config.DIGEST_CHANNEL_ID or not config.DIGEST_TIME:
                return

            now = datetime.datetime.now()
            current_time = now.strftime("%H:%M")
            today = now.date()

            if current_time == config.DIGEST_TIME and self.last_run_date != today:
                self.last_run_date = today
                await self.run_digest()
        except Exception as e:
            print(f"Digest Task Error: {e}")

    async def run_digest(self):
        print(f"Running daily digest at {datetime.datetime.now()}")
        
        try:
            channel_id = int(config.DIGEST_CHANNEL_ID)
            target_channel = self.bot.get_channel(channel_id)
        except (ValueError, TypeError):
            print(f"Digest Error: Invalid channel ID {config.DIGEST_CHANNEL_ID}")
            return

        if not target_channel:
            # Try fetching if not in cache
            try:
                target_channel = await self.bot.fetch_channel(channel_id)
            except:
                print(f"Digest Error: Could not find target channel {channel_id}")
                return

        # Collect activity from last 24h
        yesterday = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
        summary_data = []

        for guild in self.bot.guilds:
            for channel in guild.text_channels:
                # Basic permission check
                perms = channel.permissions_for(guild.me)
                if not perms.read_messages or not perms.read_message_history:
                    continue
                
                try:
                    messages = []
                    async for msg in channel.history(after=yesterday, limit=50):
                        if not msg.author.bot and msg.clean_content:
                            messages.append(f"{msg.author.display_name}: {msg.clean_content}")
                    
                    if messages:
                        summary_data.append(f"--- Channel: #{channel.name} ---")
                        # Use at most last 15 messages to avoid blowing up context
                        summary_data.extend(messages[-15:]) 
                except Exception as e:
                    print(f"Error fetching history for #{channel.name}: {e}")

        if not summary_data:
            print("Digest: No activity found to summarize.")
            # If manually triggered, notify the user
            # (Note: we already responded to the interaction)
            return

        # Summarize with AI
        activity_text = "\n".join(summary_data)
        # Limit total text size
        if len(activity_text) > 15000:
            activity_text = activity_text[:15000] + "\n... (truncated)"

        prompt = "You are an activity summarizer. Below is a log of messages from various Discord channels over the past 24 hours. Create a concise, engaging 'Daily Digest' summary highlighting the key discussions, decisions, and highlights. Use bullet points and group by channel where appropriate."
        
        try:
            messages = [{"role": "user", "content": f"Here is the activity log:\n\n{activity_text}"}]
            response, provider_name = providers.chat(messages, prompt)
            
            # Post to digest channel
            embed = discord.Embed(
                title=f"📅 Daily Digest - {datetime.datetime.now().strftime('%B %d, %Y')}",
                description=response[:4000], # Discord limit safety
                color=discord.Color.purple()
            )
            embed.set_footer(text=f"Powered by {provider_name}")
            await target_channel.send(embed=embed)
            
        except Exception as e:
            print(f"Digest Error during AI summary: {e}")

    @daily_digest.before_loop
    async def before_daily_digest(self):
        await self.bot.wait_until_ready()

async def setup(bot: commands.Bot):
    await bot.add_cog(Digest(bot))
