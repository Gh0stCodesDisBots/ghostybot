const {
  getStickyData,
  getServerPrefix,
  sendToDev,
  generateXp,
  getUserXp,
  setUserXp,
  addUserXp,
} = require("../utils/functions");

const queue = new Map();

module.exports = {
  name: "message",
  async execute(bot, message) {
    if (message.channel.type === "dm") return;
    const stickyData = await getStickyData(message.guild.id);
    const guildId = message.guild.id;
    const userId = message.author.id;
    const cooldowns = bot.cooldowns;

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const serverPrefix = (await getServerPrefix(message.guild.id)) || "!"; //* Change using !prefix <new prefix>
    const prefix = new RegExp(
      `^(<@!?${bot.user.id}>|${escapeRegex(serverPrefix)})\\s*`
    );

    // Check if sticky
    const isSticky = message.channel.id === stickyData?.channelId;

    if (isSticky) {
      if (message.author.bot || message.content === stickyData.msg) return;

      const fMessage = message.channel.messages.cache.get(stickyData.id);
      if (fMessage) {
        fMessage.delete();
      }

      const stickyMessage = await message.channel.send(stickyData.msg);
      stickyData.id = stickyMessage.id;
    }

    // xp - levels
    if (!message.author.bot) {
      const userXp = await getUserXp(guildId, userId);

      if (userXp === null || !userXp) {
        setUserXp(guildId, userId, generateXp(10, 15));
      } else {
        addUserXp(guildId, userId, generateXp(10, 15));
      }
    }
    // Commands
    if (
      !prefix.test(message.content) ||
      message.author.bot ||
      userId === bot.user.id
    )
      return;

    const [, matchedPrefix] = message.content.match(prefix);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // music queue
    const serverQueue = queue.get(message.guild.id);

    try {
      const cmd =
        bot.commands.get(command) || bot.commands.get(bot.aliases.get(command));

      if (bot.commands.has(cmd?.name)) {
        const now = Date.now();
        const timestamps = cooldowns.get(cmd.name);
        const cooldownAmount = cmd.cooldown * 1000;

        if (timestamps.has(userId)) {
          const expTime = timestamps.get(userId) + cooldownAmount;

          if (now < expTime) {
            const timeleft = (expTime - now) / 1000;
            return message.reply(
              `Please wait **${timeleft.toFixed(
                1
              )}** more seconds before using the **${cmd.name}** command`
            );
          }
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownAmount);

        cmd.execute(bot, message, args, serverQueue, queue);
      } else {
        console.log("Command not found");
      }
    } catch (e) {
      sendToDev(message, bot, e);
      console.log(e);
    }
  },
};
