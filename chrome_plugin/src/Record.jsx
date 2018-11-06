import React from 'react';
import { Redirect } from 'react-router-dom';
import { ButtonToolbar, Button, Row } from 'react-bootstrap';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

export default class Record extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			start: false,
			publish: true,
			reinit: true,
			redirect: false,
			selector: '',
			data: []
		};
		this.clickStart = this.clickStart.bind(this);
		this.clickPublish = this.clickPublish.bind(this);
		this.clickReinit = this.clickReinit.bind(this);
		this.clickLogout = this.clickLogout.bind(this);

		setInterval(() => {
			/*
			let data = this.state.data;
			data.push([Math.round(Math.random()*100)]);
			this.setState({data: data});
			*/

			chrome.runtime.sendMessage({ kind: 'getState' }, response => {
				this.setState(() => {
					return {
						start: response.isRecording,
						publish: !response.isRecording,
						reinit: !response.isRecording,
						redirect: false,
						groupSessionToken: response.groupSessionToken
					};
				});
			});

			chrome.runtime.sendMessage({
				kind: 'getEntropies',
				groupSessionToken: this.state.groupSessionToken,
				number: 20
			}, (response) => {
				chrome.extension.getBackgroundPage().console.log(`Response from Record.jsx is : ${response}`);
				this.setState((oldState) => {
					return {
						data: response.data
					};
				});
			});
		}, 1500);
	}

	componentDidMount() {
		chrome.runtime.sendMessage({ kind: 'getState' }, response => {
			this.setState(() => {
				return {
					start: response.isRecording,
					publish: !response.isRecording,
					reinit: !response.isRecording,
					redirect: false,
					groupSessionToken: response.groupSessionToken
				};
			});
		});
	}

	clickStart(event) {
		event.preventDefault();
		chrome.runtime.sendMessage({ kind: 'start' });
		this.setState(() => {
			return {
				start: true,
				publish: false,
				reinit: false,
				redirect: false
			};
		});
	}

	clickPublish(event) {
		event.preventDefault();
		console.log('start publish');
		chrome.runtime.sendMessage({
			kind: 'publish',
			groupSessionToken: this.state.groupSessionToken
		}, () => {
			console.log('publish ok');
			this.setState(() => {
				return {
					start: false,
					publish: true,
					reinit: true,
					redirect: false
				};
			});
		});
	}

	clickReinit(event) {
		event.preventDefault();
		chrome.runtime.sendMessage({ kind: 'reinit' });
		this.setState(() => {
			return {
				start: false,
				publish: true,
				reinit: true,
				redirect: false
			};
		});
	}

	clickLogout(event) {
		event.preventDefault();
		chrome.runtime.sendMessage({ kind: 'logout' });
		this.setState(() => {
			return {
				redirect: true
			};
		});
	}

	render() {
		if (this.state.redirect) {
			return <Redirect to="/popup.html" />;
		}
		else{
			let buttonToolbar = this.state.start?(
				<ButtonToolbar>
					<Button bsStyle="primary" onClick={this.clickPublish}>Publish</Button>
					<Button bsStyle="danger" onClick={this.clickReinit}>Delete</Button>
					<Button bsStyle="danger" onClick={this.clickLogout}>Logout</Button>
				</ButtonToolbar>
			):(
				<ButtonToolbar>
					<Button bsStyle="primary" onClick={this.clickStart}>Record</Button>
					<Button bsStyle="danger" onClick={this.clickLogout}>Logout</Button>
				</ButtonToolbar>
			);
			return (
				<div>
					<p>Share your groupSessionToken : {this.state.groupSessionToken}</p>
					<HighchartsReact
						highcharts={Highcharts}
						options={{
							chart: {
								type: 'spline',
								animation: Highcharts.svg,
								height: 200
							},
							legend: {
								enabled: false
							},
							credits: false,
							title: null,
							xAxis: {
								type: 'datetime',
								labels: {
									enabled: false
								}
							},
							yAxis: {
								title: null
							},
							series: [{
								data: this.state.data
							}]
						}}
					/>
					{buttonToolbar}
				</div>
			);
		}
	}
}
