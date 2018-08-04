import React from 'react'
import api from '../api'
import ChatMessage from './ChatHistory.jsx'
const windowStyle = {
  display: "inline-block",
  height: "500px",
  width: "375px",
  border: "1px solid black",
  position: "fixed",
  verticalAlign: "bottom",
  left: "0px",
  backgroundColor: "white",
  zIndex: "0",
  overflow: "hidden",
}

const messageStyle = {
  listStyleType: "none",
  fontName: "Roboto",
  overflow: "hidden"
}

class Messenger extends React.Component {
  constructor(props){
    super()
    this.state = {
      user: "",
      message: "",
      chatHistory: [],
      roomID: ""
    }
    this.socket = props.socket;
    this.sendMessage = this.sendMessage.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.setUser = this.setUser.bind(this)
    this.grabChat = this.grabChat.bind(this)
  }

  componentDidMount(){
    this.setUser()

  }

  setUser (){
    api.verify().then((user)=>{
      this.setState({
        user
      })
    })
  }

  grabChat(){
    this.socket.on('chathistory', (history) => {
      this.setState({ chatHistory: history })
    })
  }

  handleChange(e) {
    this.setState({ message: e.target.value })
  }

  sendMessage(e) {
    e.preventDefault();
    this.socket.emit('message', {user: this.state.user.username, message: this.state.message})
    this.grabChat()
  }

  render() {
    return (
      <div style={windowStyle}>
      <form onSubmit={this.sendMessage}>
        <input type="text" value={this.state.message} onChange={this.handleChange} />
        <input type="submit" value="Submit" />
      </form>
        <ul style={messageStyle}>
        {this.state.chatHistory.map((message)=><ChatMessage message={message} />)}
      </ul>
      </div>
    )
  }
}

export default Messenger;
