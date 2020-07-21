const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "queue",
    description: "Show top 20 songs in the queue",
    execute(bot, message, args, serverQueue, queue) {
        if (!message.member.voice.channel) {
            return message.channel.send("You need to be in a voice channel!");
        }

        if (!serverQueue) {
            return message.channel.send("There are no songs in the queue")
        }

        const embed = new MessageEmbed()
            .setTitle(`${message.guild.name}'s Music Queue`)
            .setColor("BLUE")
            .setDescription(serverQueue.songs.splice(0, 20).map((song) => {
                return `- ${song.title}`
            }))

        message.channel.send(embed);
    }
}