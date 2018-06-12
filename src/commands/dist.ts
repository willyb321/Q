/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed, getEdsmApiResult, writeLog} from '../utils';
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

export class DistCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'dist',
			group: 'misc',
			memberName: 'dist',
			description: 'Get distance between 2 systems.',
			details: 'Get distance between 2 systems.',
			examples: ['dist "San Tu", "Sol"'],
			guildOnly: true,
			args: [
				{
					label: 'System 1',
					key: 'sys1',
					prompt: "System 1?",
					type: 'string'
				},
				{
					label: 'System 2',
					key: 'sys2',
					prompt: "System 2?",
					type: 'string'

				}
			]
		});
	}

	hasPermission(msg) {
		return msg.client.isOwner(msg.author);
	}

	async run(msg, args) {
		const embed = genEmbed('Distance Between', `${args.sys1} & ${args.sys2}`);
		let seconds;
		const system1 = args.sys1;
		const system2 = args.sys2;
		let system1coords;
		let system2coords;
		return getEdsmApiResult(`system?showCoordinates=1&systemName=${encodeURIComponent(system1)}`).then(system1info => {
			writeLog(`Fetched information for ${system1}`, 'EDSM SysDist');
			if (system1info.coords !== undefined) {
				writeLog(`Info for ${system1} looks OK`, 'EDSM SysDist');
				getEdsmApiResult(`system?showCoordinates=1&systemName=${encodeURIComponent(system2)}`).then(system2info => {
					writeLog('Fetched information for ' + system2, 'EDSM SysDist');
					if (system2info.coords !== undefined) {
						writeLog(`Info for ${system2} looks OK, calculating distance`, 'EDSM SysDist');
						system1coords = [system1info.coords.x, system1info.coords.y, system1info.coords.z];
						system2coords = [system2info.coords.x, system2info.coords.y, system2info.coords.z];
						const distance = mathjs.distance(system1coords, system2coords).toFixed(2);
						seconds = distance * 9.75 + 300;
						const days = Math.floor(seconds / (3600 * 24));
						seconds -= days * 3600 * 24;
						const hrs = Math.floor(seconds / 3600);
						seconds -= hrs * 3600;
						const mnts = Math.floor(seconds / 60);
						seconds -= mnts * 60;
						embed.setTitle(`Distance between \`${system1}\` and \`${system2}\``);
						embed.setDescription(`**\`\`\`${distance} Ly\`\`\`**\n**Ship transfer time: \`${days}d${hrs}h${mnts}m\`**`);

						writeLog(`Distance between ${system1} and ${system2}: ${distance} Ly`, 'EDSM SysDist');
						return msg.channel.send({embed});
					} else {
						embed.setDescription(':x: Could not locate one of the systems!');
						return msg.channel.send({embed});
					}
				});
			} else {
				embed.setDescription(':x: Could not locate one of the systems!');
				return msg.channel.send({embed});
			}
		});
	}

}
