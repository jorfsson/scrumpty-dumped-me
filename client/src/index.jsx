import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";
import Navbar from "./Components/Navbar.jsx";
import Login from "./Components/Login.jsx";
import Logout from "./Components/Logout.jsx";
import Register from "./Components/Register.jsx";
import Sprint from "./Components/Sprint.jsx";
//import AddSprint from "./Components/AddSprint.jsx";
import api from "./api";
import UpdateUserForm from "./Components/UpdateUserForm.jsx";
import socketIOClient from "socket.io-client";


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      sprintList: [],
      sprint_id: false,
      sprint: ``,
      loggedIn: null
    };
    this.updateUser = this.updateUser.bind(this);
    this.updateSprintList = this.updateSprintList.bind(this);
    this.logout = this.logout.bind(this);
    this.setSprint = this.setSprint.bind(this);

    this.socket = socketIOClient("http://127.0.0.1:1337")
  }

  componentDidMount() {
    // Any time app re-renders, check for user session
    this.updateUser();
  }

  updateSprintList() {
    // Fetch sprints for user
    return api.getSprints().then((sprintList) => {
      this.setState({ sprint_id: sprintList[0].id, sprint: `/sprint/${sprintList[0].id}`});
    });
  }

  logout() {
    // Destroy user session
    api.logout().then((res) => {
      if (res) {
        this.setState({ user: null, sprintList: [], sprint: null });
      }
    });
  }

  setSprint(id) {
    this.setState({
      sprint_id: id
    })
  }

  updateUser() {
    // Check for user credentials, then fetch sprints for user
    api.verify().then((user) => {
      if (user) {
        this.setState({ user });
        this.updateSprintList()
      }
    });
  }

  render() {
    const { user, sprintList } = this.state;
    return (
      <Router>
        <div style={{ fontFamily: 'Roboto' }}>
          <Navbar
            user={user}
            logout={this.logout}
            sprintList={sprintList}
          />
          <hr style={{ marginBottom: '3.5em' }} />
          <Route
            exact
            path="/"
            render={
              () => this.state.user && this.state.sprint ? <Redirect to={this.state.sprint} /> :
                <Login history={history} updateUser={this.updateUser} />}
          />
          {/*<Route
            path="/login"
            render={({ history }) => (
              <Login history={history} updateUser={this.updateUser} />
            )}
          />*/}
          <Route
            path="/logout"
            render={({ history }) => (
              <Logout history={history} logout={this.logout} />
            )}
          />
          <Route
            path="/updateuser"
            render={({ history }) => (
              <UpdateUserForm history={history} user={user} />
            )}
          />
          <Route
            path="/register"
            render={({ history }) => (
              <Register history={history} updateUser={this.updateUser} setSprint={this.setSprint} />
            )}
          />
          {/* <Route
            path="/addsprint"
            render={({ history }) => (
              <AddSprint
                history={history}
                updateSprintList={this.updateSprintList}
              />
            )}
          /> */}
          <Route
            path="/sprint/:id"
            render={routeprops => (
              <Sprint user={user} {...routeprops} socket={this.socket}/>
            )}
          />
        </div>
      </Router>
    );
  }
}
render(<App />, document.getElementById('app'));
