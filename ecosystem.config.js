module.exports = {
	/**
	 * Application configuration section
	 * http://pm2.keymetrics.io/docs/usage/application-declaration/
	 */
	apps: [
		// First application
		{
			name: 'CTM Bot',
			script: 'ctm-bot.js',
			watch: false,
			log_date_format: 'YYYY-MM-DD HH:mm Z',
			instance_var: '0',
			env: {
				NODE_ENV: 'development'
			},
			env_production: {
				NODE_ENV: 'production',
			}
		}
	],

	/**
	 * Deployment section
	 * http://pm2.keymetrics.io/docs/usage/deployment/
	 */
	deploy: {
		production: {
			user: 'node',
			host: 'willb.info',
			ssh_options: 'Port=56499',
			ref: 'origin/master',
			repo: 'ctmbot:willyb321/ctmbot.git',
			path: '/opt/node/ctm-bot',
			'pre-deploy-local':
				'scp -P56499 ecosystem.config.js node@willb.info:~/apps/ecosystem.ctm.config.js && scp -r -P56499 config.json node@willb.info:~/ctm-bot/current/',
			'post-deploy':
				'npm install && pm2 startOrRestart ~/apps/ecosystem.ctm.config.js --env production'
		}
	}
};
