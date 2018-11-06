import { login , getJWTFromGitHubSession, postScenario , token, getEntropies } from './services.js';

class PageManager {
	constructor() {
		this.scenario = [];
		this.isRecording = false;
		this.isLoggedIn = false;
		this.windowId = 0;
		this.tabId = 0;
		this.groupSessionToken = '';
		this.handleMessage = this.handleMessage.bind(this);
		this.startRecording = this.startRecording.bind(this);
		this.startRecording = this.startRecording.bind(this);
		this.getRecordedScenarioAndStop = this.getRecordedScenarioAndStop.bind(this);
		this.reinitRecording = this.reinitRecording.bind(this);
		this.webNavigationCommitted = this.webNavigationCommitted.bind(this);
		this.webNavigationCompleted = this.webNavigationCompleted.bind(this);


		chrome.webNavigation.onCommitted.addListener(this.webNavigationCommitted);
		chrome.webNavigation.onCompleted.addListener(this.webNavigationCompleted);

		this.addBrowserListeners();
	}

	start() {
		chrome.runtime.onMessage.addListener(this.handleMessage);
	}

	handleMessage(msg, sender, sendResponse) {
		//chrome.extension.getBackgroundPage().console.log(`Received message : ${msg.kind}`);
		switch (msg.kind) {

		case 'login':
			//chrome.extension.getBackgroundPage().console.log('Received login message from background.js');
			login(msg.credential)
				.then(response => {
					if (response.logged === false) {
						this.isLoggedIn = false;
					} else {
						this.isLoggedIn = true;
						this.jwt = response.jwt;
					}
					this.groupSessionToken = response.groupSessionToken;
					let responseToMsg = {isLoggedIn : this.isLoggedIn, groupSessionToken: this.groupSessionToken};
					sendResponse(responseToMsg);
				})
				.catch((ex) => {
					//console.log(ex);
					sendResponse(false);
				});
			return true;

		case 'token':
			token(msg.credential)
				.then(response => {
					if (response.logged === false) {
						this.isLoggedIn = false;
					} else {
						this.isLoggedIn = true;
						this.jwt = response.jwt;
					}
					this.groupSessionToken = response.groupSessionToken;
					let responseToMsg = {isLoggedIn : this.isLoggedIn};
					sendResponse(responseToMsg);
				})
				.catch((_) => {
					//console.log(ex);
					sendResponse(false);
				});
			return true;

		case 'github':
			getJWTFromGitHubSession(msg.code)
				.then(response => {
					if (response.logged === false) {
						this.isLoggedIn = false;
					} else {
						this.isLoggedIn = true;
						this.jwt = response.jwt;
					}
					this.groupSessionToken = response.groupSessionToken;
					let responseToMsg = {isLoggedIn : this.isLoggedIn};
					sendResponse(responseToMsg);
				})
				.catch((ex) => {
					//console.log(ex);
					sendResponse(false);
				});
			return true;

		case 'logout':
			this.isLoggedIn = false;
			this.jwt = undefined;
			break;

		case 'start':
			this.startRecording();
			break;

		case 'publish':
			var recordedScenario = this.getRecordedScenarioAndStop();
			postScenario(recordedScenario, this.jwt, msg.groupSessionToken)
				.then( response => {
					sendResponse(response);
				})
				.catch( ex => {
					sendResponse(ex);
				});
			return true;

		case 'reinit':
			this.reinitRecording();
			break;

		case 'getState':
			chrome.extension.getBackgroundPage().console.log(`getState groupSessionToken is : ${this.groupSessionToken}`);
			sendResponse({
				isLoggedIn: this.isLoggedIn,
				isRecording: this.isRecording,
				groupSessionToken: this.groupSessionToken
			});
			break;

		case 'action' :
			if (this.isRecording) this.addActionToScenario(msg.action);
			break;

		case 'getEntropies':
			getEntropies(this.jwt, msg.groupSessionToken, msg.number)
				.then(data => {
					chrome.extension.getBackgroundPage().console.log(`data is : ${JSON.stringify(data)}`);
					let values = data.map(datum => datum.entropyValue);
					chrome.extension.getBackgroundPage().console.log(`values are : ${JSON.stringify(values)}`);
					sendResponse({
						data: values
					});
				})
				.catch((ex) => {
					//console.log(ex);
					chrome.extension.getBackgroundPage().console.log(`Error while getting data !`);
					sendResponse(false);
				});
			return true;
		}
	}

	startRecording() {
		this.scenario = [];
		this.isRecording = true;

		chrome.windows.getCurrent({populate:true}, window => {
			this.window = window;
			this.tab = window.tabs.find( tab => {return tab.active;});
			chrome.tabs.reload(this.tab.id);
		});
	}

	getRecordedScenarioAndStop() {
		this.isRecording = false;
		return   {
			actions : this.scenario,
			wait : 8000
		};
	}

	reinitRecording() {
		this.isRecording = false;
		this.scenario = [];
	}

	webNavigationCommitted({transitionType, url}) {
		if (transitionType === 'reload' || transitionType === 'start_page' || transitionType === 'link') {
			pageManager.scenario.push({type:'GotoAction', url:url});
		}
	}

	webNavigationCompleted({tabId, frameId}) {
		if (this.tab && (this.tab.id === tabId  ))  {
			if (frameId === 0) {
				chrome.tabs.executeScript(this.tab.id, {file:'listener.bundle.js'},
					result => chrome.extension.getBackgroundPage().console.log(result == undefined?'Failed loading attachListener':'Success loading attachListener'));
				chrome.tabs.executeScript(this.tab.id, {file:'favicon.js'});
			}
		}
	}

	addActionToScenario(action) {
		if (this.scenario.length > 0) {
			let lastAction = this.scenario[this.scenario.length - 1];
			if (lastAction.type === 'TypeAction' && action.type === 'TypeAction') {
				if (lastAction.selector.watId === action.selector.watId) {
					this.scenario.pop();	
				}
			}
		}
		action.timestamp = Date.now();
		this.scenario.push(action);
	}

	addBrowserListeners(){
		//Monitor tab creation
		chrome.tabs.onCreated.addListener(tab => {
			chrome.runtime.sendMessage({kind:'action', action: {type:'TabCreatedAction', url: tab.url, title: tab.title} });
		});

		//Monitor tab removal
		chrome.tabs.onCreated.addListener(tab => {
			chrome.runtime.sendMessage({kind:'action', action: {type:'TabRemovedAction', url: tab.url, title: tab.title} });
		});
	}
}

var pageManager = new PageManager();
pageManager.start();
