const ObjectID = require('mongodb').ObjectID;
const express = require('express');
const passport = require('passport');

function init(serverNames, webServer, db, logger) {
	logger.info('Set Entropy api');
	let router = express.Router();
	router.use(passport.authenticate('jwt', {failureRedirect: '/login' , session:false}));

	router
		.get('/:groupSessionToken/:n',(req, res) => {
			logger.info(`Queried entropy for ${req.params.groupSessionToken} for a number of ${req.params.n}`);
			db.collection('entropy', {strict:true}, (err, entropyCollection) => {
				if (err) {
					logger.info('Collection entropy not created yet !');
					res.status(404).send(err).end();
				} else {
                    entropyCollection.find({groupSessionToken: req.params.groupSessionToken}).sort({_id: 1}).limit(eval(req.params.n)).toArray()
                        .then(entropiesArray => {
                            logger.info(`RouteEntropy: response to GET = ${entropiesArray}`);
                            res.status(200).send(entropiesArray).end();
                        })
                        .catch(err => {
                            logger.error(`RouteEntropy: response to GET = ${err}`);
                            res.status(500).send(err).end();
                        });
				}
			});
		});

	router
		.post('/',(req, res) => {
			db.collection('entropy', (err, entropyCollection) => {
				if (err) {
                    logger.error(err);
					res.status(404).send(err).end();
				} else {
					let entropy = {
						groupSessionToken: req.body.groupSessionToken,
                        value: req.body.value,  // Entropy value between 0 and 100
                    };
					entropyCollection.insertOne(entropy)
						.then(savedEntropy => {
							res.status(200).send(savedEntropy).end();
						})
						.catch(err => {
							logger.error(err);
							res.status(500).send(err).end();
						});
				}
			});
		});

	webServer.use('/api/entropy', router);
}


module.exports.init = init;