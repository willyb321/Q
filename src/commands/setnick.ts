
/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../utils';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import * as Raven from 'raven';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true,
	dataCallback(data) { // source maps
		const stacktrace = data.exception && data.exception[0].stacktrace;

		if (stacktrace && stacktrace.frames) {
			stacktrace.frames.forEach(frame => {
				if (frame.filename.startsWith('/')) {
					frame.filename = 'app:///' + basename(frame.filename);
				}
			});
		}

		return data;
	}
}).install();

export class SetNickNameCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'nick',
			group: 'misc',
			memberName: 'nick',
			description: 'Set discord nickname.',
			details: 'Set discord nickname.',
			examples: ['nick Q-Bot'],
			guildOnly: false,
			ownerOnly: true,
			args: [
				{
					label: 'Nickname',
					key: 'name',
					prompt: 'New nickname?',
					type: 'string'
				}
			]
		});
	}

	hasPermission(msg) {
		return msg.client.isOwner(msg.author);
	}

	async run(msg, args) {
		try {
			await msg.client.user.setUsername(args.name);
		} catch (err) {
			console.error(err);
			return msg.channel.send('Failed to change nickname');
		}
		return msg.channel.send(`Set new nickname to \`\`\`${args.name}\`\`\``);
	}

}
