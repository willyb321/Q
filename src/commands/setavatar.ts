
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

export class SetAvatarCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'avatar',
			group: 'misc',
			memberName: 'avatar',
			description: 'Set avatar.',
			details: 'Set avatar.',
			examples: ['avatar <link>', 'avatar <file>'],
			guildOnly: false,
			ownerOnly: true,
			args: [
				{
					label: 'Avatar URL',
					key: 'url',
					prompt: 'URL to avatar image?',
					type: 'string',
					default: ''
				}
			]
		});
	}

	hasPermission(msg) {
		return msg.client.isOwner(msg.author);
	}

	async run(msg, args) {
		let url = '';
		if (!args.url && msg.attachments.first()) {
			url = msg.attachments.first().url;
		} else if (args.url) {
			url = args.url;
		}
		try {
			await msg.client.user.setAvatar(url);
		} catch (err) {
			console.error(err);
			return msg.channel.send(`Failed to set avatar to ${url}`);
		}
		const embed = genEmbed('New Avatar', url);
		embed.setImage(url);
		return msg.channel.send({embed})
	}

}
