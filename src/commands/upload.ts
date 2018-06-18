
/**
 * @module Commands
 */
/**
 * ignore
 */
import {config, genEmbed} from '../utils';
import * as Commando from 'discord.js-commando';
import {basename, extname, join} from 'path';
import * as Raven from 'raven';
import * as yauzl from 'yauzl';
import * as LineByLineReader from 'line-by-line';
import * as request from 'request-promise-native';
import {tmpdir} from 'os';
import {createWriteStream} from 'fs';
import {Log, User} from '../db';


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


export class UploadCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'upload',
			group: 'misc',
			memberName: 'upload',
			description: 'Upload your journals.',
			details: 'Upload your journals.',
			examples: ['upload <attach zip of logs>'],
			guildOnly: false
		});
	}

	hasPermission(msg) {
		return true;
	}

	async run(msg) {
		if (!msg.attachments.first()) {
			return msg.reply('Give me an attachment');
		}
		if (!msg.attachments.first().name.endsWith('.zip')) {
			return msg.reply('Give me a .zip');
		}
		const tmpdate = new Date().toISOString().replace(':', '').replace('.', '');
		const tmppath = join(tmpdir(), `tmpupload-${tmpdate}-${msg.id}.zip`);
		request(msg.attachments.first().url)
			.pipe(createWriteStream(tmppath))
			.on('close', () => {
				openZip(tmppath, msg)
			})
	}

}

function openZip(tmppath, msg) {
	const path = join(tmpdir(), `curlog-${msg.id}.log`);
	yauzl.open(tmppath, {lazyEntries: true}, (err, zipfile) => {
		if (err) {
			if (err.message.startsWith('unsupported compression method')) {
				return msg.reply('Give me a proper zip.');
			}
			console.error(err);
		}
		let count = 0;
		msg.channel.send(`File downloaded and zip opened. ${zipfile.entryCount} entries`);
		zipfile.readEntry();
		zipfile.on('end', () => {
			msg.channel.send(`Zip fully read. ${zipfile.entryCount} entries`);
		});
		zipfile.on('entry', function(entry) {
			console.log(entry);
			count++;
			if (/\/$/.test(entry.fileName) || !isCommanderLog(entry.fileName)) {
				// Directory file names end with '/'.
				// Note that entires for directories themselves are optional.
				// An entry's fileName implicitly requires its parent directories to exist.
				zipfile.readEntry();
			} else {
				// file entry
				zipfile.openReadStream(entry, function(err, readStream) {
					if (err) {
						throw err;
					}
					readStream.on('end', function() {
						zipfile.readEntry();
					});

					readStream.pipe(createWriteStream(path))
						.on('close', () => {
							msg.channel.send(`Processing file ${entry.fileName} (${count}/${zipfile.entryCount})`);
							readLog(path, msg)
						})
				});
			}
		});
	});
}

function readLog(log, msg) {
	const lr = new LineByLineReader(log);
	lr.on('error', err => {
		Raven.captureException(err);
	});
	let cmdr: any = '';
	let lines = [];
	lr.on('line', line => {
		Raven.context(function() {
			Raven.captureBreadcrumb({
				message: 'Log-process line',
				data: {
					line: line,
					filename: log
				}
			});
			let parsed;
			if (!parsed) {
				try {
					parsed = JSON.parse(line);
				} catch (e) {
					Raven.captureException(e);
				}
				if (parsed) {
					lines.push(parsed);
				}
			}
		})
	});
	lr.on('end', err => {
		if (err) {
			Raven.captureException(err);
		}
		cmdr = lines.find(elem => elem.event === 'Commander');
		if (cmdr) {
			cmdr = cmdr.Name;
		}
		for (const line of lines) {
			processLogLine(line, cmdr, msg);
		}
		lines = [];
	})

}

/**
 * Get the path of the logs.
 * @param fpath {string} Path to check.
 * @returns {boolean} True if the directory contains journal files.
 */
function isCommanderLog(fpath) {
	const base = basename(fpath);
	return base.indexOf('Journal.') === 0 && extname(fpath) === '.log';
}

function processLogLine(line, cmdr, msg) {
	if (!line) {
		return;
	}
	Log.findOrCreate({where: {msg: line, cmdr, event: line.event}})
		.then(() => {

		})
		.catch(err => {
			console.error(err);
		})
}
