import axios from 'axios';

export function login(credentials) {
	return new Promise( (resolve, reject) => {
		const url = `${BASE_URL}/api/login`;
		axios.post(url, credentials  )
			.then( response => {
				if (response.status === 200 ) {
					console.log(`groupSessionToken in services : ${response.data.groupSessionToken}`);
					resolve({
						logged : true,
						jwt: response.data.jwt,
						groupSessionToken: response.data.groupSessionToken
					});
				} else {
					console.log('incorrect');
					resolve({
						logged : false
					});
				}
			})
			.catch((ex) => {
				console.log('incorrect');
				reject(ex);
			});
	});
}

export function token(credentials){
	return new Promise( (resolve, reject) => {
		const url = `${BASE_URL}/api/token`;
		chrome.extension.getBackgroundPage().console.log(`api token url : ${url}`);
		chrome.extension.getBackgroundPage().console.log(`api token credentials : ${JSON.stringify(credentials)}`);
		axios.post(url, credentials  )
			.then( response => {
				if (response.status === 200 ) {
					console.log(`groupSessionToken in services : ${response.data.groupSessionToken}`);
					resolve({
						logged : true,
						jwt: response.data.jwt,
						groupSessionToken: response.data.groupSessionToken
					});
				} else {
					console.log('incorrect');
					resolve({
						logged : false
					});
				}
			})
			.catch((ex) => {
				console.log('incorrect');
				reject(ex);
			});
	});
}

export function postScenario(scenario, jwt, groupSessionToken) {
	return new Promise((resolve, reject) => {
		const url = `${BASE_URL}/api/scenario`;
		axios.post(url, {
			scenario: scenario,
			groupSessionToken: groupSessionToken
		}, {headers: {'Authorization': `Bearer ${jwt}`}})
			.then( response => {
				resolve(response.data);
			})
			.catch(err => {
				reject(err);
			});
	});
}

export function getEntropies(jwt, groupSessionToken, number){  //TODO
	return new Promise((resolve, reject) => {
		const url = `${BASE_URL}/api/entropy/${groupSessionToken}/${number}`;
		axios.get(url, {headers: {'Authorization': `Bearer ${jwt}`}})
			.then( response => {
				chrome.extension.getBackgroundPage().console.log(`Successfully got data in services.getEntropies`);
				resolve(response.data);
			})
			.catch(err => {
				chrome.extension.getBackgroundPage().console.log(`Error in services.getEntropies : ${err.stack}`);
				reject(err);
			});
	});
}

export function getJWTFromGitHubSession(code) {
	return new Promise((resolve, reject) => {
		const url = `${BASE_URL}/api/github/plugin`;
		axios.post(url, {code:code})
			.then(response => {
				if (response.status === 401) {
					resolve({
						logged : false
					});
				} else {
					resolve({
						logged : true,
						jwt: response.data.jwt
					});
				}
			})
			.catch(err => {
				reject(err);
			});
	});
}

