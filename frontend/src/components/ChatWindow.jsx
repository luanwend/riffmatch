import { useEffect, useRef, useState } from 'react'
import api, { errorMessage } from '../api'
import { useAuth } from '../AuthContext'
import { formatTime } from '../utils'
import Avatar from './Avatar'

export default function ChatWindow({ endpoint, event, belongs, showSender }) {
  const { user, socket } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const list = useRef(null)

  function addMessage(message) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
  }

  useEffect(() => {
    setMessages([])
    api.get(endpoint).then((res) => setMessages(res.data.messages)).catch((err) => setError(errorMessage(err)))
  }, [endpoint])

  useEffect(() => {
    if (!socket) return
    const handler = (message) => belongs(message) && addMessage(message)
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [socket, endpoint])

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight
  }, [messages])

  async function send(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    try {
      const res = await api.post(endpoint, { content })
      addMessage(res.data)
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="chat-window">
      <div className="messages" ref={list}>
        {messages.length === 0 && <p className="muted center">No messages yet. Say hi! 👋</p>}
        {messages.map((message) => {
          const mine = message.sender_id === user.id
          return (
            <div key={message.id} className={`message-row ${mine ? 'mine' : ''}`}>
              {showSender && !mine && <Avatar user={message.sender} size={28} />}
              <div className="message">
                {showSender && !mine && <span className="sender">{message.sender.name}</span>}
                <p>{message.content}</p>
                <time>{formatTime(message.created_at)}</time>
              </div>
            </div>
          )
        })}
      </div>
      {error && <p className="error">{error}</p>}
      <form className="chat-input" onSubmit={send}>
        <input
          value={text}
          maxLength={1000}
          placeholder="Type a message..."
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn primary">Send</button>
      </form>
    </div>
  )
}
