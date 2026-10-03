import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import Avatar from '../components/Avatar'
import ChatWindow from '../components/ChatWindow'
import InviteToBand from '../components/InviteToBand'
import KebabMenu from '../components/KebabMenu'
import Modal from '../components/Modal'

export default function Chats() {
  const { friendId } = useParams()
  const { socket } = useAuth()
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(null)

  function loadFriends() {
    api.get('/friends')
      .then((res) => setFriends(res.data.friends))
      .finally(() => setLoading(false))
  }

  useEffect(loadFriends, [])

  useEffect(() => {
    if (!socket) return
    socket.on('unfriended', loadFriends)
    socket.on('notification', loadFriends)
    return () => {
      socket.off('unfriended', loadFriends)
      socket.off('notification', loadFriends)
    }
  }, [socket])

  const friend = friends.find((f) => f.id === Number(friendId))

  async function unfriend(f) {
    if (!window.confirm(`Remove ${f.name} from your friends?`)) return
    await api.delete(`/friends/${f.id}`)
    if (f.id === friend?.id) navigate('/chats')
    loadFriends()
  }

  const menuItems = (f) => [
    { label: 'Invite to band', onClick: () => setInviting(f) },
    { label: 'Unfriend', danger: true, onClick: () => unfriend(f) },
  ]

  return (
    <div className={`chat-layout ${friendId ? 'has-active' : ''}`}>
      <aside className="chat-sidebar">
        <h3>Friends</h3>
        {!loading && friends.length === 0 && (
          <p className="muted small">
            No friends yet. <Link to="/">Start swiping!</Link>
          </p>
        )}
        {friends.map((f) => (
          <div key={f.id} className={`friend-item ${f.id === friend?.id ? 'active' : ''}`}>
            <Link to={`/chats/${f.id}`} className="friend-link">
              <Avatar user={f} size={42} />
              <div>
                <strong>{f.name}</strong>
                <small>{f.instruments.join(' · ')}</small>
              </div>
            </Link>
            <KebabMenu items={menuItems(f)} />
          </div>
        ))}
      </aside>

      <section className="chat-main">
        {friend ? (
          <>
            <div className="chat-header">
              <Link to="/chats" className="back-link">
                ←
              </Link>
              <Link to={`/users/${friend.id}`} className="chat-title">
                <Avatar user={friend} size={36} />
                <div>
                  <strong>{friend.name}</strong>
                  <small>View profile</small>
                </div>
              </Link>
              <KebabMenu items={menuItems(friend)} />
            </div>
            <ChatWindow
              endpoint={`/chat/${friend.id}/messages`}
              event="direct_message"
              belongs={(m) => m.sender_id === friend.id || m.receiver_id === friend.id}
            />
          </>
        ) : (
          <div className="empty-chat">
            {loading ? 'Loading...' : friendId ? 'This chat is not available.' : 'Select a friend to start chatting.'}
          </div>
        )}
      </section>

      {inviting && (
        <Modal title={`Invite ${inviting.name} to a band`} onClose={() => setInviting(null)}>
          <InviteToBand friend={inviting} />
        </Modal>
      )}
    </div>
  )
}
