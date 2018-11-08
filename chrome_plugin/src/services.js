import axios from 'axios';
import { ok } from 'assert';

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

export function newToken(){
	return new Promise( (resolve, reject) => {
		const url = `${BASE_URL}/api/token`;
		axios.get(url)
			.then( response => {
				if (response.status === 200 ) {
					chrome.extension.getBackgroundPage().console.log(`groupSessionToken from newToken service response : ${response.data.groupSessionToken}`);
					resolve({
						groupSessionToken: response.data.groupSessionToken
					});
				} else {
					console.log('incorrect');
					resolve({
						groupSessionToken: undefined
					});
				}
			})
			.catch((e) => {
				console.log(e.stack);
				reject(e);
			});
	});
}

export function token(groupSessionToken){
	return new Promise( (resolve, reject) => {
		const url = `${BASE_URL}/api/token`;
		axios.post(url, {groupSessionToken: groupSessionToken})
			.then( response => {
				if (response.status === 200 ) {
					resolve({
						groupSessionToken: response.data.groupSessionToken
					});
				} else {
					reject(`/api/token error ${response.status}`);
				}
			})
			.catch((e) => {
				console.log(e.stack);
				reject(e);
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
				chrome.extension.getBackgroundPage().console.log('Are my updates working ?');
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

