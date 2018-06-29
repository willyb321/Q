/**
 * @module Commands
 */
/**
 * ignore
 */
import * as Raven from 'raven';
import {config} from '../utils';
import * as Commando from 'discord.js-commando';
import {client} from '../index';

Raven.config(config.ravenDSN, {
	autoBreadcrumbs: true
}).install();

export class PurgeCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'purge',
			group: 'admin',
			memberName: 'purge',
			description: 'Purge messages.',
			details: 'Purge messages.',
			examples: ['purge 5'],

			args: [
				{
					key: 'amount',
					prompt: 'How many messages to purge?',
					type: 'integer',
					validate: val => parseInt(val) >= 1 && parseInt(val) < 25
				}
			]
		});
	}
	hasPermission(message) {
		return client.isOwner(message.author)
	}
	async run(message, args) {

		let limit = args.amount;
		if (!limit) {
			return;
		}
		if (limit > 25) {
			limit = 25;
		}
		message.channel.messages.fetch({limit: limit + 1})
			.then(messages => message.channel.bulkDelete(messages))
			.catch(err => {
				Raven.captureException(err);
			});
		return null;
	}
}
