
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

export class TimeCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'time',
			group: 'misc',
			memberName: 'time',
			description: 'Get current ingame time.',
			details: 'Get current ingame time.',
			examples: ['time'],
			guildOnly: true
		});
	}

	hasPermission(msg) {
		return true;
	}

	async run(msg) {
		const currentTime = new Date().toISOString();
		const timestamp = `${parseInt(currentTime.split(/-(.+)/, 2)[0]) + 1286}-${currentTime.split(/-(.+)/, 2)[1]}`;
		const embed = genEmbed('Current In-Game Time', `\n**\`\`\`${timestamp.replace(/T/, ' ').replace(/\..+/, '')}\`\`\`**`);
		return msg.channel.send({embed});
	}

}
