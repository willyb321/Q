/**
 * @module Commands
 */
/**
 * ignore
 */
import {genEmbed} from '../utils';
import {config} from '../config';
import * as Commando from 'discord.js-commando';
import * as Snoowrap from 'snoowrap';

const r = new Snoowrap({
	userAgent: 'CTM Bot (github.com/willyb321)',
	clientId: config.redditClientId,
	clientSecret: config.redditClientSecret,
	refreshToken: config.redditRefreshToken
});

const lookUpOnECL = input => r.getSubreddit('EliteCombatLoggers').search({query: input.toString(), sort: 'new', time: 'all'});

export class ECLCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'cl',
			aliases: ['log', 'clog'],
			group: 'misc',
			memberName: 'cl',
			description: 'Look up on /r/ECL.',
			examples: ['cl mocke'],
			guildOnly: false,

			args: [
				{
					key: 'name',
					prompt: 'Commander name?',
					type: 'string',
					infinite: false
				}
			]
		});
	}

	async run(message, args) {
		if (!message.guild) {
			return;
		}
		let elems;
		try {
			elems = await lookUpOnECL(args.name);
		} catch (err) {
			console.error(err);
			return message.channel.send('Something broke. Ping willyb321#2816');
		}
		const embed = genEmbed('Combat logger found', '')
			.setAuthor('Combat Log', 'https://willb.info/i/f67c5f149780f7644da35a6121d93096');
		if (elems && elems[0]) {
			let links = '';
			elems.forEach(elem => links += `https://reddit.com${elem.permalink}\n`);
			embed.setDescription(links);
			embed.setTitle(`Combat logger found. ${elems.length} Counts`);
			return message.channel.send({embed});
		} else {
			embed.setDescription('Nothing but the wind...');
			embed.setTitle('Not found');
			return message.channel.send({embed});
		}
	}
}
