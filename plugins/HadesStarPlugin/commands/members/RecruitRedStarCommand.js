import { Command } from '../../../../lib';
const Discord = require('discord.js');

export class RecruitRedStarCommand extends Command {
  constructor(plugin) {
    super(plugin, {
      name: 'recruitrs',
      aliases: ['rrs'],
      description: "Start a RS recruit message.",
      usage: "&rrs RSNUM"
    });
  }

  async run(message, args) {
    if (args[0] && (args[0] > 0 && args[0] < 12)) { //If level between 1 and 12
      message.delete({ timeout: 1 });    //Delete User message
      this.sendInitialMessage(message, args[0], 600000); //Send recuit message
    } else {
      return message.channel.send("You must specifiy a valid Red Star level (1-11)")
    }
  }

  async failed(message, rsLevel) {
    //Add Reactions to a dictionary
    let testString = ""
    message.reactions.cache.forEach(reaction =>
      reaction.users.cache.forEach(user => {
        if (!user.bot) {
          if (reaction.emoji.name == "✅" || reaction.emoji.name == "❎") {
            testString += `${user} ${reaction.emoji.name}`
          }
        }
      }))
    if (testString == "") testString = "None";

    //If no people write None
    let newEmbed = new Discord.MessageEmbed(message.embeds[0])
    newEmbed.fields[0].value = `0/0` //"Current People"
    newEmbed.fields[1].value = `${testString}` //"Members"
    newEmbed.setColor("RED")
    newEmbed.setFooter("Closed")
    message.edit(newEmbed)
  }

  async updateEmbed(message, rsLevel) {
    //Variables
    const reacted = new Map();

    //Add Reactions to a dictionary
    message.reactions.cache.forEach(reaction =>
      reaction.users.cache.forEach(user => {
        if (!user.bot) {
          if (reaction.emoji.name == "✅" || reaction.emoji.name == "❎") {
            reacted.set(user, reaction.emoji.name);
          }
        }
      }
      ))

    //If no people write None
    let testString = ""
    reacted.forEach((value, key) => testString += ` ${key} ${value} \n`)
    if (testString == "") testString = "None";

    let newEmbed = new Discord.MessageEmbed(message.embeds[0])
    newEmbed.fields[0].value = `${reacted.size}/4` //"Current People"
    newEmbed.fields[1].value = `${testString}` //"Members"

    if (reacted.size == 4) newEmbed.setColor("GREEN"); else newEmbed.setColor("ORANGE"); //Set Color to Green when All Ready
    message.edit(newEmbed) // Send Edit

    if (reacted.size == 4) {  // Ping people that is done
      done[message.id] = true;
      let testString = ""
      reacted.forEach((value, key) => testString += ` ${key} ${value} ,`)
      testString += `Full Team for RS${rsLevel}!`
      message.reactions.removeAll()
      message.channel.send(testString);
    }
  }

  async sendInitialMessage(msgObject, rsLevel, timeout) {
    //Variables
    let role = msgObject.guild.roles.cache.find(role => role.name === `RS${rsLevel}`);
    let reactionFilter = (reaction, user) => !user.bot
    var done = false

    let pollEmbed = new Discord.MessageEmbed()
      .setTitle(`RS ${rsLevel} Recruitment invitation by ${msgObject.author.username}:`)
      .setThumbnail("https://i.imgur.com/hedXFRd.png")
      .setDescription(`Do you want to be part of this Red Star? <@&${role.id}> \n React below if you have croid or not`)
      .addField("Current People", "0/4")
      .addField("Members", "None")
      .setColor("ORANGE")
      .setFooter("This invitation will be on for 10 minutes")

    const messageReaction = await msgObject.channel.send(pollEmbed);
    await messageReaction.react('✅') //Send Initial Reaction
    await messageReaction.react('❎') //Send Initial Reaction
    await messageReaction.react('🚮') //Send Initial Reaction

    let collector = messageReaction.createReactionCollector(reactionFilter, { time: timeout, dispose: true });
    collector.on('collect', (reaction, user) => {
      if (done == true) reaction.remove();
      else
        if (reaction.emoji.name == "🚮") { //When Trash
          if (user.id == msgObject.author.id) {
            done = true
            messageReaction.reactions.removeAll()
            this.failed(messageReaction, rsLevel);
          }
        } else {
          if (reaction.emoji.name != '✅' && reaction.emoji.name != '❎') { // If its not V or X
            reaction.remove() // Remove the Reaction
          } else {
            var reacted = {}
            messageReaction.reactions.cache.forEach(reaction =>
              reaction.users.cache.forEach(user =>
                (user in reacted) ? reacted[user]++ : reacted[user] = 0
              )) // Get Every Reaction

            if (reacted[user] > 0) { // If User has already a reacion
              reaction.users.remove(user); // Remove it
            } else {
              this.updateEmbed(messageReaction, rsLevel) //Update the Embeed to show the new reaction
            }
          }
        }
    });
    collector.on('remove', (reaction, reactionCollector) => { // When a reaction is removed
      if (done == false) this.updateEmbed(messageReaction, rsLevel)
    });

    collector.on('end', (reaction, reactionCollector) => { // When timeout done
      messageReaction.reactions.removeAll()
      this.failed(messageReaction, rsLevel);
    });
  }
}

