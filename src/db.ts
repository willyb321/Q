import * as Sequelize from 'sequelize';
import {config} from './config';

const sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPwd, {
	host: 'localhost',
	dialect: 'postgres',

	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	},

	// http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
	operatorsAliases: false
});

export const User = sequelize.define('User', {
	discordID: Sequelize.STRING,
	killCount: Sequelize.INTEGER,
	name: Sequelize.STRING
});

export const Log = sequelize.define('Log', {
	msg: Sequelize.JSONB,
	cmdr: Sequelize.STRING,
	event: Sequelize.STRING
}, {
	indexes: [
		{
			unique: false,
			fields: ['cmdr'],
		},
		{
			unique: false,
			fields: ['event'],
		}
	]
});

sequelize.sync()
	.then(() => {

	})
	.catch(err => {
		console.error(err);
	});
