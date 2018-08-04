import React from 'react'

const ChatMessage = (props) =>
  (<li>{props.message.user}: {props.message.message}</li>)

export default ChatMessage
