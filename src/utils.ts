import {config} from "./config";

export {config} from './config';
import * as Discord from 'discord.js';
import * as consola from 'consola';
import * as rp from 'request-promise';
import * as Commando from "discord.js-commando";

export const genEmbed = (title, desc) => new Discord.MessageEmbed()
	.setTitle(title)
	.setAuthor(config.botName, 'https://willb.info/images/2018/06/05/3d6d829d1cb595eccf43eca5638f2883.png')
	.setDescription(desc)
	.setFooter('By Willyb321', 'https://willb.info/images/2018/06/05/3d6d829d1cb595eccf43eca5638f2883.png')
	.setTimestamp();

export function writeLog(message: string, prefix?: string, writeToFile?) {
	if (!prefix) {
		prefix = '[Debug]'; // By default put [Debug] in front of the message
	}
	const logger = consola.withScope(prefix);
	logger.info(message);
}

export function getInaraPage(page): any { // Grab a whole page's HTML from INARA, and return it all as a string
	writeLog('Retrieving INARA page: https://inara.cz/' + page, 'HTTP');
	try {
		return rp({
			url: 'https://inara.cz/' + page,
			headers: {
				'user-agent': config.botName,
				Cookie: `esid=${config.inaraCookieEsid}; elitesheet=${config.inaraCookieElitesheet}`
			},
			timeout: 30000
		})
			.then(body => {
				return body
			})
			.catch(err => {
				writeLog('Failed to retrieve INARA page: ' + err, 'HTTP');
				return null;
			});
	} catch (err) {
		writeLog('Failed to retrieve INARA page: ' + err, 'HTTP');
		return null;
	}
}

export function getCmdrInfoFromInara(name) { // Search inara for a CMDR, do some stuff with regexps, and return part of a formatted message
	const searchResultsRegexp = /Commanders found.*?\/cmdr\/(\d+)/i;
	const cmdrDetailsNameRegexp = /<span class="pflheadersmall">CMDR<\/span> (.*?)<\/td>/i;
	const cmdrDetailsAvatarRegexp = /<td rowspan="4" class="profileimage"><img src="(.*)"><\/td>/i;
	const cmdrDetailsTableRegexp = /<span class="pflcellname">(.*?)<\/span><br>(.*?)<\/td>/gi;
	const loginToSearchRegexp = /You must be logged in to view search results.../;

	return getInaraPage(`search?location=search&searchglobal=${encodeURIComponent(name)}`).then(searchResults => {
		if (searchResults) {
			const searchResultsMatches = searchResults.match(searchResultsRegexp);
			const loginToSearchMatches = searchResults.match(loginToSearchRegexp);
			if (loginToSearchMatches == null) {
				if (searchResultsMatches == null) {
					return new Commando.FriendlyError(':x: No INARA profiles found.');
				} else {
					return getInaraPage(`cmdr/${searchResultsMatches[1]}`).then((cmdrDetails: any) => {
						if (cmdrDetails) {
							writeLog('processing data', 'CMDR-INARA');
							const cmdrDetailsNameMatches = cmdrDetails.match(cmdrDetailsNameRegexp);
							const cmdrDetailsAvatarMatches = cmdrDetails.match(cmdrDetailsAvatarRegexp);
							const inaraInfo = {
								CMDR: cmdrDetailsNameMatches[1]
							};
							cmdrDetails.replace(cmdrDetailsTableRegexp, (match, p1, p2) => {
								inaraInfo[p1] = p2;
							});
							const embed = genEmbed(`INARA Profile:`, `**CMDR ${inaraInfo.CMDR.toUpperCase()}**`);
							embed.setThumbnail(`https://inara.cz${cmdrDetailsAvatarMatches[1]}`);
							embed.setURL(`https://inara.cz/cmdr/${searchResultsMatches[1]}`);
							for (const inaraInfoEntry in inaraInfo) {
								if (inaraInfo[inaraInfoEntry] !== '&nbsp;' && inaraInfo[inaraInfoEntry] !== '' && inaraInfo[inaraInfoEntry] !== ' ') {
									embed.addField(`**${inaraInfoEntry}**: `, inaraInfo[inaraInfoEntry])
								}
							}

							writeLog('Done! sending to channel', 'CMDR-INARA');
							return embed;
						} else {
							return new Commando.FriendlyError('Profile page retrieval failed!');
						}
					});
				}
			} else {
				return new Commando.FriendlyError('Need login creds to INARA updated!');
			}
		} else {
			return new Commando.FriendlyError('Search results page retrieval failed!');
		}
	});
}


export function getEdsmApiResult(page, log?) { // Query EDSM's api for something
	writeLog(`Retrieving EDSM APIv1 results: https://www.edsm.net/api-v1/${page}`, 'HTTP');
	console.log(page);
	console.log(log)
	return rp({
		url: !log ? 'https://www.edsm.net/api-v1/' + page : 'https://www.edsm.net/api-logs-v1/' + page,
		headers: {
			'user-agent': config.botName,
		},
		json: true,
		timeout: 30000
	}).then(body => {
		console.log(body);
		if (body === undefined) {
			writeLog('Error retrieving EDSM APIv1 result!', 'HTTP');
			console.error('Error retrieving EDSM APIv1 results!');
			return null;
		}
		return body;
	})
		.catch(err => {
			writeLog(`Error retrieving EDSM APIv1 result: ${err}`, 'HTTP');
		})
}

export function getInformationAboutSystem(input) { // Query EDSM for the details about a system
	const returnedEmbedObject = genEmbed('Error!', ':x: No systems found.');
	return getEdsmApiResult(`system?showId=1&showCoordinates=1&showPermit=1&showInformation=1&systemName=${encodeURIComponent(input)}`).then(systeminfo => {
		writeLog(`Got EDSM Info for ${input.toString()}`, 'EDSM SysInfo');
		if (systeminfo.name !== undefined) {
			writeLog(`Info for ${input.toString()} looks OK.`, 'EDSM SysInfo');

			returnedEmbedObject.setTitle(`System Information for __${systeminfo.name}__`);

			returnedEmbedObject.setDescription(`EDSM:  *<https://www.edsm.net/en/system/id/${systeminfo.id}/name/${encodeURIComponent(systeminfo.name)}>*`);
			if (systeminfo.information.eddbId !== undefined) {
				returnedEmbedObject.addField('EDDB', `*<https://eddb.io/system/${systeminfo.information.eddbId}>*`);
			}
			if (systeminfo.information.faction !== undefined) {
				returnedEmbedObject.addField('__Controlled by__', `${systeminfo.information.faction}, a ${systeminfo.information.allegiance || 'unknown'}-aligned  ${systeminfo.information.government || ''} faction.`);
			}

			if (systeminfo.information.factionState !== undefined) {
				returnedEmbedObject.addField('__State__', systeminfo.information.factionState);
			}
			if (systeminfo.information.population !== undefined) {
				returnedEmbedObject.addField('__Population__', systeminfo.information.population);
			}
			if (systeminfo.information.security !== undefined) {
				returnedEmbedObject.addField('__Security__', systeminfo.information.security);
			}
			if (systeminfo.information.economy !== undefined) {
				returnedEmbedObject.addField('__Economy__', systeminfo.information.economy);
			}
			return returnedEmbedObject;
			/*return getEdsmApiResult(`get-comment?systemId=${encodeURIComponent(systeminfo.id)}&apiKey=${config.edsmKey}&commanderName=ctmbot`).then(comment => {
				if (comment && comment.comment) {
					consola.info(comment);
					returnedEmbedObject.addField('__CTM Comment__', comment.comment);
				}
			});*/
		}
	});
}
