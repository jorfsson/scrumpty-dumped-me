import React from 'react';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import { StatusCode } from '../../../lib/shared';
import Tasks from './Tasks.jsx';
import SelectedProfile from './SelectedProfile.jsx';
import AddUserToSprintForm from './AddUserToSprintForm.jsx';
import Messenger from './Messaging.jsx';
import api from '../api';

class Sprint extends React.Component {
  constructor(props) {
    super(props);
    const sprint_id = +props.match.params.id || null;
    this.state = {
      sprint_id,
      isOwner: false,
      open: false,
      tasks: [],
      selectedProfile: '',
    };
    this.getNewSelectedProfile = this.getNewSelectedProfile.bind(this);
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.reload = this.reload.bind(this);
    this.socket = props.socket;
    this.messenger = (<Messenger socket={this.socket} target={this.state.selectedProfile}/>)
  }

  componentDidMount () {
    this.reload();
  }

  componentWillUpdate(nextProps) {
    if (nextProps.match.params.id !== this.state.sprint_id) {
      this.setState({ sprint_id: nextProps.match.params.id }, () => this.reload() );
    }
  }

  getNewSelectedProfile(user) {
    this.setState({ selectedProfile: user });
  }

  handleClickOpen(e) {
    e.preventDefault();
    this.setState({
      open: true,
    });
  }

  handleClose(shouldReload = false) {
    this.setState({
      open: false,
    });
    if (shouldReload) {
      this.reload();
    }
  }

  reload() {
    api.getTasks(this.state.sprint_id).then((tasks) => {
      this.setState({ tasks });
    });

    api.isOwner(this.state.sprint_id).then((res) => {
      if (!res) {
        this.setState({ isOwner: false });
      } else {
        this.setState({ isOwner: true });
      }
    });
  }

  render() {
    const tasks = this.state.tasks;
    const notStarted = tasks.filter(
      x => x.status_code === StatusCode.NotStarted,
    );
    const inProgress = tasks.filter(
      x => x.status_code === StatusCode.InProgress,
    );
    const complete = tasks.filter(x => x.status_code === StatusCode.Complete);

    const paperStyle = {
      background: '#F3EAEE',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100%',
      position: 'relative',
      whiteSpace: 'normal',
    };

    const headerStyle = {
      fontFamily: 'Roboto',
      fontSize: '1.3em',
      fontColor: 'D3D3D3',
      width: '85%',
      height: '70%',
      padding: '5px',
      fontStyle: 'italic',
      border: '0.1px gray',
      borderStyle: 'solid none solid none',
      margin: '10px auto'
    }

    let profile;
    let messenger;
    if (this.state.selectedProfile) {
      profile = (
        <SelectedProfile
          sprint_id={this.state.sprint_id}
          reload={this.reload}
          selectedProfile={this.state.selectedProfile}
        />
      );
      messenger = (
        <Messenger socket={this.socket} target={this.state.selectedProfile}/>
      )

    } else {
      profile = (
        <Card>
          <p style={{ textAlign: 'center' }}>
            Click on someone in your dating pool to view their profile
          </p>
        </Card>
      );

    }

    return (
      <div onClick={this.closeEdits}>
        <Drawer variant="permanent" anchor="right">
          <AddUserToSprintForm
            user={this.props.user}
            isOwner={this.state.isOwner}
            sprint_id={this.state.sprint_id}
            selectedProfile={this.state.selectedProfile}
            getNewSelectedProfile={this.getNewSelectedProfile}
          />
        </Drawer>
        <Grid
          style={{ padding: '1em', width: '85%' }}
          container
          spacing={24}
          justify="center"
        >
          <Grid item xs={3}>
            <Paper style={paperStyle}>
              <Typography style={headerStyle} variant="headline" component="h4" align="center" gutterBottom={true}>
                Selected Profile
              </Typography>
              {profile}
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper style={paperStyle}>
              <Typography style={headerStyle} variant="headline" component="h4" align="center" gutterBottom={true}>
                To Do
              </Typography>
              <Tasks
                sprint_id={this.state.sprint_id}
                reload={this.reload}
                tasks={notStarted}
              />
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper style={paperStyle}>
            <Typography style={headerStyle} variant="headline" component="h4" align="center" gutterBottom={true}>
                In Progress
              </Typography>
              <Tasks
                sprint_id={this.state.sprint_id}
                reload={this.reload}
                tasks={inProgress}
              />
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper style={paperStyle}>
              <Typography style={headerStyle} variant="headline" component="h4" align="center" gutterBottom={true}>
                Completed
              </Typography>
              <Tasks
                sprint_id={this.state.sprint_id}
                reload={this.reload}
                tasks={complete}
              />
            </Paper>
          </Grid>
        </Grid>
          {messenger}
      </div>
    );
  }
}

export default Sprint;
