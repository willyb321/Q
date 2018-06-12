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

export class InitGuildCommand extends Commando.Command {
    constructor(client) {
        super(client, {
            name: 'initguild',
            group: 'misc',
            memberName: 'initguild',
            description: 'initguild.',
            details: 'initguild.',
            examples: ['initguild'],
            guildOnly: true
        });
    }

    hasPermission(msg) {
        return msg.client.isOwner(msg.author);
    }

    async run(msg) {
    	try {
			await msg.client.provider.set(msg.guild, 'botSpam', msg.channel.id)
		} catch (err) {
			console.error(err);
			Raven.captureException(err);
		}
        return msg.channel.send(`Bot channel set to ${msg.channel.toString()}`);
    }

}
