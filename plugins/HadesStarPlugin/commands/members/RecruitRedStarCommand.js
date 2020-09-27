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
    if (args[0]) {
      if (args[0] > 0 && args[0] < 12) { //If level between 1 and 12
        return this.startMessage(message, args[0], 600000) // Start with 10 minutes timout
      } else {
        return message.channel.send("Please add a valid Red Star Level. (1-11)")
      }
    } else {
      return message.channel.send("You must specifiy a valid Red Star level. A timeout can be added.")
    }
  }
  async startMessage(msgObject, rsLevel, timeout) {
    msgObject.delete({ timeout: 1 });    //Delete User message
    this.sendInitialMessage(msgObject, rsLevel, timeout); //Send recuit message
  }

  async failed(message, rsLevel) {
    let amm = 0;

    //Add Reactions to a dictionary
    let testString = ""
    message.reactions.cache.forEach(reaction =>
      reaction.users.cache.forEach(user => {
        if (!user.bot) {
          if (reaction.emoji.name == "✅" || reaction.emoji.name == "❎") {
            amm++;
            testString += `${user} ${reaction.emoji.name}`
          }
        }
      }
      ))

    if (amm < 4) {
      //If no people write None
      if (testString == "") testString = "None";
      let role = message.guild.roles.cache.find(role => role.name === `RS${rsLevel}`);
      let newEmbed = new Discord.MessageEmbed()
        .setTitle(`@RS${rsLevel} Recruitment:`)
        .setDescription(`Do you want to be part of this Red Star? <@&${role.id}> \n React below if you have croid or not`)
        .addField("Current People", `${amm}/4 Closed`)
        .addField("Members", ` ${testString}\n Closed`)
      newEmbed.setColor("RED")
      message.edit(newEmbed)
    }
  }

  async updateEmbed(message, rsLevel, messageAutor) {
    //Variables
    let amm = 0;
    var reacted = {}
    let testString = ""
    const role = message.guild.roles.cache.find(role => role.name === `RS${rsLevel}`);

    //Add Reactions to a dictionary
    message.reactions.cache.forEach(reaction =>
      reaction.users.cache.forEach(user => {
        if (!user.bot) {
          reacted[user] = reaction.emoji.name
          if (reaction.emoji.name == "✅" || reaction.emoji.name == "❎") {
            amm++;
            testString += `${user} ${reaction.emoji.name} \n`
          }
        }
      }
      ))

    //If no people wirte None
    if (testString == "") testString = "None";

    let newEmbed = new Discord.MessageEmbed()
      .setTitle(`@RS${rsLevel} Recruitment invitation by ${messageAutor.username}:`)
      .setThumbnail("https://i.imgur.com/hedXFRd.png")
      .setDescription(`Do you want to be part of this Red Star? <@&${role.id}> \n React below if you have croid or not`)
      .addField("Current People", `${amm}/4`)
      .addField("Members", testString)
      .setFooter("This invitation will be on for 10 minutes")

    if (amm == 4) newEmbed.setColor("GREEN"); else newEmbed.setColor("ORANGE"); //Set Color to Green when All Ready
    message.edit(newEmbed) // Send Edit

    if (amm == 4) {
      done[message.id] = true;
      // Ping people that is done
      let testString = ""
      reacted.forEach(user => {
        if (reacted[user] == "✅" || reacted[user] == "❎") {
          amm++;
          testString += `${user}, `
        }
      })

      if (testString == "") testString = "None"
      else
        testString += `Full Team for RS${rsLevel}!`
      message.reactions.removeAll()
      message.channel.send(testString);
    }
  }

  async sendInitialMessage(msgObject, rsLevel, timeout) {

    let role = msgObject.guild.roles.cache.find(role => role.name === `RS${rsLevel}`);

    let pollEmbed = new Discord.MessageEmbed()
      .setTitle(`RS ${rsLevel} Recruitment invitation by ${msgObject.author.username}:`)
      .setThumbnail("https://i.imgur.com/hedXFRd.png")
      .setDescription(`Do you want to be part of this Red Star? <@&${role.id}> \n React below if you have croid or not`)
      .addField("Current People", "0/4")
      .addField("Members", "None")
      .setColor("ORANGE")
      .setFooter("This invitation will be on for 10 minutes")

    let reactionFilter = (reaction, user) => !user.bot
    const time = timeout
    var done = false
    const messageReaction = await msgObject.channel.send(pollEmbed);
    await messageReaction.react('✅') //Send Initial Reaction
    await messageReaction.react('❎') //Send Initial Reaction
    await messageReaction.react('🚮') //Send Initial Reaction

    let collector = messageReaction.createReactionCollector(reactionFilter, { time: time, dispose: true });
    collector.on('collect', (reaction, user) => {
      if (reaction.emoji.name == "🚮") { //When Trash
        if (user.id == msgObject.author.id) {

          reaction.users.remove(user);
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
            this.updateEmbed(messageReaction, rsLevel, msgObject.author) //Update the Embeed to show the new reaction
          }
        }
      }
    });
    collector.on('remove', (reaction, reactionCollector) => { // When a reaction is removed
      if (done == false)
        this.updateEmbed(messageReaction, rsLevel, msgObject.author)
    });

    collector.on('end', (reaction, reactionCollector) => { // When timeout done
      messageReaction.reactions.removeAll()
      this.failed(messageReaction, rsLevel);
    });
  }
}

