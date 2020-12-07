import { CorpCommand } from './CorpCommand';
import { Member, Corp, Tech, RankRoles } from '../../database';
import { findBestMatch } from 'string-similarity';
import Mongoose from 'mongoose'
import { TechTree } from '../../techs';

const replies = [
    "Allright, just retry without dyslexia.",
    "Jesus... try again.",
    "Seriously? Do it again.",
    "lol",
    "...",
    "> https://learnenglish.britishcouncil.org/",
    "Look, it's pretty simple, I gave you a very clear list of valid names already.",
    "People nowadays just ignore the Help Command and hit themselves with a wall and cry.",
    "."
];

const possibleRanks = [
    "guest",
    "trader",
    "mercenary",
    "member",
    "officer",
    "whitestarcommander",
    "firstofficer"
]

export class SetRankRolesCommand extends CorpCommand{
    constructor(plugin){
        super(plugin, {
            name: 'setrankroles',
            aliases: ['srr'],
            description: "Sets the role for one of the known categories: \n" +
            " - SupremeCommander. \n - FirstOfficers. \n - Officers. \n - Members. \n - Mercenaries. \n - Traders. \n - WhiteStarCO.\n" + 
            "To use this command, the category must be the name of any of the previously mentioned, and for the role, either the role's name, or tag the role.",
            usage: "&setrankroles <category> <role>."
        });
    }
    async run(message, args){
        if(message.mentions.users.length > 0) return message.channel.send("I'll ignore that you just tagged a person for a role related command.")
        if(!message.mentions.roles) return message.channel.send("You need to mention a role for this command!")
        const members = await message.guild.members.fetch();
        let author 
        await members.forEach(member => {
            if(member.id === message.author.id) {
                author = member
            }  
        })
        if(!author.hasPermission("ADMINISTRATOR") || !author.hasPermission("MANAGE_GUILD")) {
            let MemberResult = (await Member.findOne({discordId: author.id}))
            if(!MemberResult)
                return message.channel.send("You aren't a member of any Corporations.")
            else{
                let actualCorp
                let corp = await Corp.findOne({corpId: message.channel.guild.id})
                if(!corp) {
                    let corporation = new Corp({
                        _id: new Mongoose.Types.ObjectId(),
                        name: message.guild.name,
                        corpId: message.guild.id,
                        members: []
                    });
                    await corporation.save();
                    message.channel.send("Created this Coporation in the Hades' Corps area! It will be visible from any server who I am in when they ask for the known Corporations! (although this can be configured later to be removed)")
                    actualCorp = corporation
                }
                else actualCorp = corp
                RankRoles.findOne({corpId: message.guild.id}, roles => {
                    if(!roles) {
                        return message.channel.send("No structure was defined for this Corp yet, please tell an administrator to set it.")
                    }
                    else {
                        let AuthorRoles = author.roles.cache.map(role => role.id)
                        if(AuthorRoles.contains(roles.Guest) || AuthorRoles.contains(roles.Mercenary)) {
                            return message.channel.send("You are not part of this Corporation.")
                        }
                        else if (AuthorRoles.contains(roles.Officer) || AuthorRoles.contains(roles.FirstOfficer)) {
                            SetRank(message, args, actualCorp)
                        }
                        else {
                            return message.channel.send("You do not have the authority to use this command.")
                        }
                    }
                }).catch(err => console.log(err))
            }
        }
        else {
            let actualCorp
            let corp = await Corp.findOne({corpId: message.channel.guild.id})
            if(!corp) {
                let corporation = new Corp({
                    _id: new Mongoose.Types.ObjectId(),
                    name: message.guild.name,
                    corpId: message.guild.id,
                    members: []
                });
                await corporation.save();
                message.channel.send("Created this Coporation in the Hades' Corps area! It will be visible from any server who I am in when they ask for the known Corporations! (although this can be configured later to be removed)")
                actualCorp = corporation
            }
            else actualCorp = corp
            SetRank(message, args, actualCorp)
        }
    }
}

async function SetRank(message, args, Corporation) {
    let importantModification = false
    let isMerc = false
    let rank = await findBestMatch(args[0], possibleRanks)
    let answer = await findRank(message, args[0], rank.bestMatch.target)
    let mention = `${message.mentions.roles.first().id}`
    let roleStructure = await RankRoles.findOne({corpId: Corporation.corpId}).catch(err => console.log(err))
    if(!roleStructure) {
        roleStructure = new RankRoles({
            _id: new Mongoose.Types.ObjectId(),
            corpId: Corporation.corpId
        })
    }
    console.log(rank.bestMatch.target)
    if(!answer) return 
    switch(rank.bestMatch.target.toString()) {
        case "mercenary": {
            roleStructure.Mercenary = mention
            importantModification = true
            isMerc = true
        }break;
        case "guest": {
            roleStructure.Guest = mention
        }break;
        case "trader": {
            roleStructure.Trader = mention
        }break;
        case "member": {
            roleStructure.Member = mention
            importantModification = true
        }break;
        case "officer": {
            roleStructure.Officer = mention
            importantModification = true
        }break;
        case "whitestarcommander": {
            roleStructure.WhiteStarCommander = mention
            importantModification = true
        }break;
        case "firstofficer": {
            roleStructure.FirstOfficer = mention
            importantModification = true
        }break;
        default: {}break;
    }
    if(importantModification) {
        createAllUsersUnderMention(message, isMerc, Corporation)
    }
    roleStructure.save()
    Corporation.rankRoles = roleStructure._id
    Corporation.save()
    return message.channel.send("Role setting process completed.")
}

async function createAllUsersUnderMention(message, isMerc, Corporation) {
    let role = message.mentions.roles.first()
    const members = await message.guild.members.fetch()
    members.forEach(member => {
        if(member.roles.cache.find(r => r.id === role.id))
            memberConstruction(member, message, isMerc, Corporation)
    })
}

async function memberConstruction(member, message, isMerc, Corporation){
    let person = await Member.findOne({discordId: member.id}).populate('Corp').catch(err => console.log(err))
    if(!person) {
        let targetName = ""
        if(!member.nickname) targetName = member.user.username
        else targetName = member.nickname
        let NewMember = new Member({
            _id: new Mongoose.Types.ObjectId(),
            name: targetName,
            discordId: member.id,
            rank: "Member",
            rslevel: 1,
            wsStatus: "No",
        })
        await generateTechSection(NewMember)
        if(isMerc){
            await (Corp.findOne({corpId: "-1"}, (err, ObtainedOne) => {
                if(err) return console.log(err)
                if(!ObtainedOne) {
                    let corp = new Corp({
                        _id: new Mongoose.Types.ObjectId(),
                        name: "No Corporation worth mentioning",
                        corpId: "-1"
                    })
                    corp.save()
                    NewMember.Corp = corp._id
                }
                else {
                    NewMember.Corp = ObtainedOne._id
                }    
            }))
            NewMember.save()
        }
        else {
            await addToCorporation(NewMember, Corporation)
            NewMember.save()
        }
    }
    else {
        if(!isMerc) {
            if(person.Corp.corpId === Corporation.corpId){}
            else if(person.Corp.corpId != '-1'){
                member.roles.cache.remove(message.mentions.roles.first())
                return message.channel.send("Seems like " + person.name + " is in another Corp. BEGONE SPY!")
            }
            else {
                addToCorporation(person, Corporation)
                person.save()
            }
        }
    }
}

async function findRank(message, query, rank) {
    if(rank.toLowerCase() != query.toLowerCase()){
        message.channel.send(`Did you mean *${rank}* ?`);
        try {
            const response = await message.channel.awaitMessages(
                m => m.author.id === message.author.id,{
                max: 1,
                time: 10000,
                errors: ['time']
            });

            if(!["y", "yes", "yeah", "yea", "yup", "yep", "ye", "of course", "right", "true"].includes(response.first().content.toLowerCase())){
                throw new Error();
            }
        } catch (err) {
            message.channel.send(replies[randomInt(0, replies.length-1)]);

            return false;
        }
    }
    return true;
}

async function generateTechSection(arrival){
    let order = 0
    for(let [techid, tech] of TechTree.get()){
        let dbTech = new Tech({
            _id: new Mongoose.Types.ObjectId(),
            name: tech.name,
            level: 0,
            category: tech.category,
            order: order,
            playerId: arrival.discordId
        })
        arrival.techs.push(dbTech);
        await dbTech.save();
        order++;
    }
}

async function addToCorporation(arrival, corp){
    arrival.Corp = corp._id
    corp.members.push(arrival);
    corp.save()
}