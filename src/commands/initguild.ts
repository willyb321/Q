/**
 * @module Commands
 */
/**
 * ignore
 */
import {config} from '../utils';
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
            guildOnly: true,
			args: [
				{
					label: 'inara', key: 'inara',
					prompt: 'Look member up on Inara when joining?', type: 'boolean'
				},
				{
					label: 'joinmsg', key: 'joinmsg',
					prompt: 'Mention user on join?', type: 'boolean'
				},
				{
					label: 'leavemsg', key: 'leavemsg',
					prompt: 'Announce leave?', type: 'boolean'
				}
			]
        });
    }

    hasPermission(msg) {
        return msg.client.isOwner(msg.author);
    }

    async run(msg, args) {
    	try {
			await msg.client.provider.set(msg.guild, 'botSpam', msg.channel.id);
			await msg.client.provider.set(msg.guild, 'botSpamInara', args.inara);
			await msg.client.provider.set(msg.guild, 'botSpamJoin', args.joinmsg);
			await msg.client.provider.set(msg.guild, 'botSpamLeave', args.leavemsg);
		} catch (err) {
			console.error(err);
			Raven.captureException(err);
		}
        return msg.channel.send(`Bot channel set to ${msg.channel.toString()}. Inara lookup on member join: ${args.inara}. Mention on join: ${args.joinmsg}. Mention on leave: ${args.leavemsg}`);
    }

}
