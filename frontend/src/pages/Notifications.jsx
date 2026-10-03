import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { useAuth } from '../AuthContext'
import Avatar from '../components/Avatar'
import { formatTime, notificationText } from '../utils'

export default function Notifications() {
  const { socket, setUnread } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    api.get('/notifications')
      .then((res) => setItems(res.data.notifications))
      .finally(() => setLoading(false))
  }

  function markRead() {
    api.post('/notifications/read').then(() => setUnread(0))
  }

  useEffect(() => {
    load()
    markRead()
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (notification) => {
      setItems((prev) => [notification, ...prev])
      markRead()
    }
    socket.on('notification', handler)
    return () => socket.off('notification', handler)
  }, [socket])

  async function act(url, redirect) {
    try {
      await api.post(url)
      if (redirect) navigate(redirect)
      else load()
    } catch (err) {
      setError(errorMessage(err))
      load()
    }
  }

  function actions(n) {
    if (n.type === 'like' && n.pending) {
      return (
        <>
          <button className="btn small" onClick={() => act(`/likes/${n.actor.id}/decline`)}>
            Decline
          </button>
          <button className="btn small primary" onClick={() => act(`/likes/${n.actor.id}/accept`)}>
            Accept
          </button>
        </>
      )
    }
    if (n.type === 'band_invite' && n.pending) {
      return (
        <>
          <button className="btn small" onClick={() => act(`/bands/invites/${n.invite_id}/decline`)}>
            Decline
          </button>
          <button
            className="btn small primary"
            onClick={() => act(`/bands/invites/${n.invite_id}/accept`, `/bands/${n.band.id}`)}
          >
            Join band
          </button>
        </>
      )
    }
    if (n.type === 'match') {
      return (
        <Link className="btn small primary" to={`/chats/${n.actor.id}`}>
          Say hi
        </Link>
      )
    }
    if (n.type === 'band_join' && n.band) {
      return (
        <Link className="btn small" to={`/bands/${n.band.id}`}>
          Open band
        </Link>
      )
    }
    return null
  }

  return (
    <div className="panel narrow">
      <h2>Notifications</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && items.length === 0 && <p className="muted">Nothing here yet. Go like some musicians!</p>}
      <ul className="notification-list">
        {items.map((n) => (
          <li key={n.id} className={n.is_read ? '' : 'unread'}>
            <Link to={`/users/${n.actor.id}`}>
              <Avatar user={n.actor} size={44} />
            </Link>
            <div className="notification-text">
              <p>{notificationText(n)}</p>
              <time>{formatTime(n.created_at)}</time>
            </div>
            <div className="notification-actions">{actions(n)}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
