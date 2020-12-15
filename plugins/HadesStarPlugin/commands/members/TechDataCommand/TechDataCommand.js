import { MemberCommand } from '../MemberCommand';
import { TechTree } from '../../../techs';
import { confirmTech } from '../../../utils';
import { Member } from '../../../database';
import { MessageEmbed } from 'discord.js';
import * as Fields from './fields';
import mapping from './mapping.json';

export class TechDataCommand extends MemberCommand{
    constructor(plugin){
        super(plugin, {
            name: 'techdata',
            aliases: ['td'],
            description: "Returns info about a certain tech in a certain level.",
            usage: "&techdata (tech) (level). Not stating any tech will show all existing techs, stating a tech will show it's description and max level. Stating a level will give detailed info on it"
        });

        this.fields = new Map(Array.from(Object.entries(Fields)).map(([key, value]) => [key.replace('Field', ''), new value()]));
    }

    async run(message, args){
        let embed = new MessageEmbed().setColor("RANDOM")

        if(!args.length) {
            embed.setTitle(`**Known Techs**`);

            TechTree.categories.forEach((category, catId) => {
                embed.addField(`*${category.name}*`, `${[...category.get().values()].map(t => t.name).join(', ')}`)
            });

            return message.channel.send(embed)
        }
        else {

            const level     = parseInt(args[args.length-1]);
            const techName  = isNaN(level) ? args.join('') : args.slice(0, -1).join('');

            const tech = TechTree.find(techName);

            if(!await confirmTech(message, techName, tech))
                return;
            
            if(isNaN(level)) {
                embed.setTitle(`**Tech: ${tech.name}**`)
                embed.setDescription(`${tech.description}\n`)
                tech.properties.forEach((value, property) => {
                    if(!Array.isArray(value)){
                        embed.addField(`*${this.getLabel(property)}*`, `${this.getField(property).render(value)}`);
                    }
                });
                embed.setFooter(`You may add a number between 1 and ${tech.levels} to get info about the required level`)
                embed.setThumbnail(`${tech.image}`)
                return message.channel.send(embed)
            }

            if(1 > level || tech.levels < level)
                return message.channel.send(`The level you requested is invalid for that tech!`)

            embed.setTitle(`**${tech.name}**`);
            embed.addField('*Level*', level);
            embed.addField('*Category*', tech.category);
            embed.addField('*Description*', tech.description);
            embed.setThumbnail(tech.image);

            tech.properties.forEach((levels, property) => {
                if(Array.isArray(levels)){
                    const field = this.getField(property);
                    embed.addField(`*${this.getLabel(property)}*`, `${field.render(levels[level - 1])}`, true);
                }
            });
            return message.channel.send(embed)
        }
    }

    getLabel(name){
        return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_(\w+)/g, ' ($1)');
    }

    getField(name){
        if(mapping.hasOwnProperty(name) && this.fields.has(mapping[name]))
            return this.fields.get(mapping[name]);
        return this.fields.get("Default");
    }
}