import React from 'react';
import { render } from 'react-dom';
import { PageHeader, Grid, Row, Col } from 'react-bootstrap';
import { BrowserRouter as Router, Route, browserHistory } from 'react-router-dom';
import Login from './Login.jsx';
import Logout from './Logout.jsx';
import Record from './Record.jsx';
import GitHub from './GitHub.jsx';
import Token from './Token.jsx';

// This is a fix for wrong popup size on macos.
chrome.runtime.getPlatformInfo(info => {
	if (info.os === 'mac') {
		setTimeout(() => {
			// Increasing body size enforces the popup redrawing
			document.body.style.width = `${document.body.clientWidth + 1}px`;
		}, 500); // 250ms is enough to finish popup open animation
	}
});

class PopupPlugin extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			groupSessionToken: ''
		};

		this.setGroupSessionTokenInState = this.setGroupSessionTokenInState.bind(this);
	}

	setGroupSessionTokenInState(groupSessionToken){
		console.log(`Set state in popup.jsx : ${groupSessionToken}`);
		this.setState({groupSessionToken: groupSessionToken});
	}

	render() {
		return (
			<Router history={browserHistory}>
				<Grid fluid={true}>
					<Row>
						<Col lg={12}>
							<PageHeader>Web Automatic Tester</PageHeader>
							<p className="lead">Record your end to end test scenario.</p>
						</Col>
					</Row>
					<Row>
						<Col lg={12}>
							<Route
								exact path="/popup.html"
								render={(props) => <Login {...props} callbackFromParent={this.setGroupSessionTokenInState} />}
							/>
							<Route path="/logout" component={Logout}/>
							<Route
								path="/record"
								render={(props) => <Record {...props} groupSessionToken={this.state.groupSessionToken} />}
							/>
							<Route path="/github" component={GitHub}/>
							<Route path="/token" component={Token}/>
						</Col>
					</Row>
				</Grid>
			</Router>
		);
	}
}

render(<PopupPlugin/>, document.getElementById('app'));
