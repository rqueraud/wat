import React from 'react';
import { Redirect } from 'react-router-dom';
import { Form, Col, FormGroup, FormControl, ControlLabel, Button, Alert } from 'react-bootstrap';

const CLIENT_ID = '28bd9c230cad1275362f';

export default class Token extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			credential : {
				token : ''
			},
			message: null,
			isLoggedIn : false
		};
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleNewSession = this.handleNewSession.bind(this);
	}

	componentDidMount() {
		chrome.runtime.sendMessage({kind:'getState'}, response => {
			this.setState(prevState => {
				return {
					credential : prevState.credential,
					isLoggedIn : response.isLoggedIn,
					message: null,
					groupSessionToken: response.groupSessionToken
				};
			});
		});
	}

	handleNewSession(event){
		event.preventDefault();
		chrome.runtime.sendMessage({ kind: 'newToken'}, (response) => {
			if (response.groupSessionToken) {
				chrome.extension.getBackgroundPage().console.log(`groupSessionToken before callback : ${response.groupSessionToken}`);
				this.props.callbackFromParent(response.groupSessionToken);
				this.setState(() => {
					return {
						groupSessionToken: response.groupSessionToken
					};
				});
			} else {
				this.setState(() => {
					return {
						groupSessionToken: undefined
					};
				});
			}
		});
	}

	handleSubmit(event) {
		event.preventDefault();

		var button = document.getElementById('joinButton');
		var span = document.createElement('span');
		span.setAttribute('class', 'glyphicon glyphicon-refresh glyphicon-refresh-animate');
		button.insertBefore(span, button.firstChild);

		let groupSessionToken = document.getElementById('token').value;
		chrome.extension.getBackgroundPage().console.log(`groupSessionToken in form field : ${groupSessionToken}`);

		chrome.runtime.sendMessage({
			kind: 'token',
			groupSessionToken: groupSessionToken
		}, (response) => {
			if (response.groupSessionToken) {
				chrome.extension.getBackgroundPage().console.log(`groupSessionToken before callback : ${response.groupSessionToken}`);
				this.props.callbackFromParent(response.groupSessionToken);
				this.setState(() => {
					return {
						groupSessionToken: response.groupSessionToken,
						message: null
					};
				});
				button.removeChild(span);
			} else {
				this.setState(() => {
					return {
						groupSessionToken: undefined,
						message: 'Invalid token. Either correct it or create a new one.'
					};
				});
				button.removeChild(span);
			}
		});
	}

	render() {
		if (this.state.groupSessionToken) {
			return <Redirect to="/record"/>;
		} else {
			return (
				<div>
					<Button onClick={this.handleNewSession}>Create Session</Button>
					<br/>
					<Form horizontal onSubmit={this.handleSubmit}>
						<FormGroup>
							<Col xs={2}><ControlLabel>Join session with Token</ControlLabel></Col>
							<Col xs={10}>
								<FormControl id="token" type="text" value={this.state.token}/>
							</Col>
						</FormGroup>
						{this.state.message &&
							<FormGroup>
								<Col xsOffset={2} xs={10}><Alert bsStyle="danger">{this.state.message}</Alert></Col>
							</FormGroup>
						}
						<FormGroup>
							<Col xsOffset={2} xs={10}><Button id="joinButton" bsStyle="primary" type="submit">Join session</Button></Col>
						</FormGroup>
					</Form>
				</div>
			);
		}

	}
}
