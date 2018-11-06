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
	}

	componentDidMount() {
		chrome.runtime.sendMessage({kind:'getState'}, response => {
			this.setState(prevState => {
				return {
					credential : prevState.credential,
					isLoggedIn : response.isLoggedIn,
					message: null
				};
			});
		});
	}

	handleSubmit(event) {
		event.preventDefault();
		var button = document.getElementById('joinButton');
		var span = document.createElement('span');
		span.setAttribute('class', 'glyphicon glyphicon-refresh glyphicon-refresh-animate');
		button.insertBefore(span, button.firstChild);
		var credential = {
			groupSessionToken: document.getElementById('token').value,
		};
		console.log(`Token in Token.jsx is : ${credential.groupSessionToken}`);
		chrome.runtime.sendMessage({ kind: 'token' , credential: credential }, (response) => {
			console.log(`isLogged:${response.isLoggedIn}`);
			if (response.isLoggedIn) {
				this.setState(() => {
					return {
						credential: credential,
						isLoggedIn : true,
						message : null
					};
				});
				button.removeChild(span);
			} else {
				this.setState(() => {
					return {
						credential: credential,
						isLoggedIn : false,
						message : 'Invalid username or password.'
					};
				});
				button.removeChild(span);
			}
		});
	}

	render() {
		if (this.state.isLoggedIn) {
			return <Redirect to="/record"/>;
		} else {
			return (
				<Form horizontal onSubmit={this.handleSubmit}>
					<FormGroup>
						<Col xs={2}><ControlLabel>Token</ControlLabel></Col>
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
			);
		}

	}
}
