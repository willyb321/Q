
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

/**
 * Coin flip
 */
const flip = () => (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';

export class FlipCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'flip',
			group: 'misc',
			memberName: 'flip',
			description: 'Flip a theoretical coin.',
			details: 'Flip a theoretical coin.',
			examples: ['flip'],
			guildOnly: true
		});
	}

	hasPermission(msg) {
		return true;
	}

	async run(msg) {
		const flipped = flip();
		console.log(`Coin flipped by ${msg.author.tag}: ${flipped}`);
		const embed = genEmbed('Coin Flipped', `Result: ${flipped}`);
		embed.addField('By:', msg.author.toString());
		return msg.channel.send({embed});
	}

}
