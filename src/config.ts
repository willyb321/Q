
/**
 * @module Utils
 */
/**
 * ignore
 */
const confToUse = '../config.json';

export const config: IConfig = require(confToUse);

export interface IConfig {
	ravenDSN: string;
	token: string;
	dbName: string;
	dbUser: string;
	dbPwd: string;
	mongoURL: string;
	ownerID: string[];
	inaraCookieElitesheet: string;
	inaraCookieEsid: string;
	edsmKey: string;
	redditClientId: string;
	redditClientSecret: string;
	redditRefreshToken: string;
	botName: string;
}
