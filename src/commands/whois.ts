/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, getCmdrInfoFromInara, writeLog} from '../utils';
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

export class WhoisCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'whois',
			group: 'misc',
			memberName: 'whois',
			aliases: ['who'],
			description: 'whois.',
			details: 'whois.',
			examples: ['whois'],
			guildOnly: true,
			args: [
				{
					label: 'cmdr', key: 'cmdr',
					prompt: 'CMDR Name?', type: 'string'
				}
			]
		});
	}

	hasPermission(msg) {
		return true;
	}

	async run(msg, args) {
		console.time(`whoislookup-getInaraInfo-${msg.id}`);
		return getCmdrInfoFromInara(args.cmdr).then(embeddedObject => {
			writeLog(`Execution of getCmdrInfoFromInara() took ${console.timeEnd(`whoislookup-getInaraInfo-${msg.id}`)} ms`, 'Timing');
			if (embeddedObject instanceof Commando.FriendlyError) {
				return msg.channel.send(embeddedObject.message);
			}
			return msg.channel.send({embed: embeddedObject});
		});
	}

}
