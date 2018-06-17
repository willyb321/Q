/**
 * @module Index
 */
/**
 * ignore
 */
// Import modules
import 'source-map-support/register';
import * as Commando from 'discord.js-commando';
import * as Raven from 'raven';
import {config, getCmdrInfoFromInara, writeLog} from './utils';
import {basename, join} from 'path';
import * as sqlite from 'sqlite';
import {oneLine} from 'common-tags';
import {createGunzip} from 'zlib';
import {TextChannel} from 'discord.js';

process.on('uncaughtException', err => {
	console.error(err);
	Raven.captureException(err);
});

process.on('unhandledRejection', (err: Error) => {
	console.error(err);
	Raven.captureException(err);
});

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

// Create an instance of a Discord client
export const client = new Commando.Client({
	owner: config.ownerID,
	commandPrefix: '?',
	unknownCommandResponse: false
});

client
	.on('error', console.error)
	.on('debug', process.env.NODE_ENV === 'development' ? console.info : () => {
	})
	.on('warn', console.warn)
	.on('disconnect', () => console.warn('Disconnected!'))
	.on('reconnecting', () => console.warn('Reconnecting...'))
	.on('commandError', (cmd, err) => {
		if (err instanceof Commando.FriendlyError) {
			return;
		}
		console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		console.log(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		console.log(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		console.log(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		console.log(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	});

client.setProvider(
	sqlite.open(join(__dirname, 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
).catch(err => {
	console.error(err);
	Raven.captureException(err);
});

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
	console.log(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	client.user.setActivity('with the human race')
		.then(() => {

		})
		.catch(err => {
			Raven.captureException(err);
		});
});

client.registry
	.registerGroup('misc', 'Misc')
	.registerDefaults()
	.registerCommandsIn(join(__dirname, 'commands'));

// Log our bot in
client.login(config.token)
	.catch((err: Error) => {
		Raven.captureException(err);
		process.exit(1);
	});

client.on('guildMemberAdd', (member) => {
	console.log(`Welcome to ${member.guild.name}, ${member.user.tag}`);
	if (!client.provider.get(member.guild, 'botSpamJoin', false)) {
		return
	}
	const channel = client.provider.get(member.guild, 'botSpam');
	const lookup = client.provider.get(member.guild, 'botSpamInara', false);
	if (channel) {
		const chan = member.guild.channels.get(channel) as TextChannel;
		if (chan) {
			chan.send(`Welcome to ${member.guild.name}, ${member.toString()}`);
			if (!lookup) {
				return;
			}
			return getCmdrInfoFromInara(member.displayName).then(embeddedObject => {
				if (embeddedObject instanceof Commando.FriendlyError) {
					return chan.send(embeddedObject.message)
				}
				return chan.send({embed: embeddedObject});
			});
		}
	}
});

client.on('guildMemberRemove', (member) => {
	console.log(`\`${member.user.tag}\` left ${member.guild.name}`);
	if (!client.provider.get(member.guild, 'botSpamLeave', false)) {
		return
	}
	const channel = client.provider.get(member.guild, 'botSpam');
	if (channel) {
		const chan = member.guild.channels.get(channel) as TextChannel;
		if (chan) {
			return chan.send(`\`${member.user.tag}\` left ${member.guild.name}`);
		}
	}
});
