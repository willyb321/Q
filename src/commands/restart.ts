
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
	dataCallback (data) { // source maps
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

export class RestartCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'restart',
			group: 'misc',
			memberName: 'restart',
			description: 'Restart bot.',
			details: 'Restart bot.',
			examples: ['restart'],
			guildOnly: true
		});
	}

	hasPermission(msg) {
		return msg.client.isOwner(msg.author);
	}

	async run(msg) {
		return msg.client.destroy()
			.then(() => process.exit(0))
			.catch(err => {
				Raven.captureException(err);
				process.exit(1);
			})
	}

}
