var argv = require('yargs').usage('$0 server.js --port=[int] --mongo=[string] --scheduler=[string]').argv;
const PORT = argv.port || 80;
var serverNames = {
	mongoServerName : argv.mongo || 'localhost',
	schedulerServerName : argv.scheduler || 'localhost'
};

const { createLogger, format, transports } = require('winston');
var express = require('express');
var helmet = require('helmet');
var path = require('path');
var bodyParser = require('body-parser');
const amqp = require('amqplib');


const logger = createLogger({
	level: 'info',
	format: format.simple(),
	transports: [
		new transports.File({ filename: './log/error.log', level: 'error' }),
		new transports.File({ filename: './log/combined.log' })
	]
});
  
if (process.env.NODE_ENV !== 'production') {
	logger.add(new transports.Console({
		format: format.simple()
	}));
}

var applicationRoot = __dirname;
const MongoClient = require('mongodb').MongoClient;
var app = express();

app.use(helmet());

app.use(express.static(path.join(applicationRoot, './app')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

const dbUrl = `mongodb://${serverNames.mongoServerName}:27017/wat_storage`;

initRoutes();

function initRoutes() {

	initRabbit(this.rmqUrl = `amqp://rabbit`, ['scenarioQueue']).then(channel => {
		MongoClient.connect(dbUrl)
		.then(db => {
			try{
				require('./login.js').init(serverNames,app,db, logger);
			}
			catch(e){
				logger.error("Error loading login.js : " + e.stack);
			}
			require('./routes/scenario.js').init(serverNames,app,db, logger, channel);
			require('./routes/run.js').init(serverNames,app,db, logger);
			require('./routes/schedule.js').init(serverNames,app,db, logger);
			require('./routes/entropy.js').init(serverNames,app,db, logger);

			app.get('*', (req,res) => {
				res.sendFile(path.join(applicationRoot, './app/index.html'));
			});

			app.listen(PORT, function() {
				logger.info(`WAT Front is listening on port ${PORT}`);
			});
		})
		.catch((e) => {
			logger.info('Erreur connecting DB');
			logger.error(e.stack);
			setTimeout(() => {
				initRoutes();
			}, 3000);
		});
	})
}

/**
 * Wait for rabbit to be available, initiate connection and create queues if needed
 * @param {string} rmqUrl
 * @param {string[]} queuesList 
 */
async function initRabbit(rmqUrl, queueList) {
    logger.info("Waiting for RabbitMQ...");
    let channel = null;
    while (!channel) {
        try {
            let amqpConnection = await amqp.connect(rmqUrl);
            channel = await amqpConnection.createConfirmChannel();
            for (let queuName of queueList) {
                await channel.assertQueue(queuName, { arguments: { "x-queue-mode": "lazy" } });
            }
        }
        catch (e) {  //TODO Catch a lower exception, so that we don't miss an important one...
            logger.debug(e.stack);
            await new Promise((resolve, _) => setTimeout(resolve, 5000));
        }
    }
    logger.info("Successfully connected to RabbitMQ");
    return channel;
}