/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed, getEdsmApiResult, getInformationAboutSystem, writeLog} from '../utils';
import * as Commando from 'discord.js-commando';
import {basename} from 'path';
import * as Raven from 'raven';
import * as mathjs from 'mathjs';

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

export class SysCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'system',
			group: 'misc',
			memberName: 'system',
			description: 'Get system info.',
			details: 'Get system info.',
			examples: ['sys San Tu'],
			aliases: ['sys'],
			guildOnly: true,
			args: [
				{
					label: 'System',
					key: 'sys',
					prompt: "System?",
					type: 'string'
				}
			]
		});
	}

	hasPermission(msg) {
		return true
	}

	async run(msg, args) {
		return getInformationAboutSystem(args.sys)
			.then(embed => {
				return msg.channel.send({embed})
			})
			.catch(err => {
				console.error(err);
				return;
			})
	}

}
