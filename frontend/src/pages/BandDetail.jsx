import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { useAuth } from '../AuthContext'
import Avatar from '../components/Avatar'
import ChatWindow from '../components/ChatWindow'
import InviteFriends from '../components/InviteFriends'

export default function BandDetail() {
  const { id } = useParams()
  const { user, socket } = useAuth()
  const navigate = useNavigate()
  const [band, setBand] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get(`/bands/${id}`)
      .then((res) => setBand(res.data))
      .catch(() => navigate('/bands'))
  }, [id, navigate])

  useEffect(load, [load])

  useEffect(() => {
    if (!socket) return
    const handler = (n) => n.band?.id === Number(id) && load()
    socket.on('notification', handler)
    return () => socket.off('notification', handler)
  }, [socket, id, load])

  if (!band) return <p className="muted">Loading...</p>

  const isOwner = band.owner_id === user.id
  const taken = [...band.members, ...band.pending_invites].map((m) => m.id)

  async function removeMember(member) {
    if (!window.confirm(`Remove ${member.name} from ${band.name}?`)) return
    try {
      await api.delete(`/bands/${id}/members/${member.id}`)
      setError('')
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function leave() {
    if (!window.confirm(`Leave ${band.name}?`)) return
    await api.post(`/bands/${id}/leave`)
    navigate('/bands')
  }

  async function deleteBand() {
    if (!window.confirm(`Delete ${band.name} and its whole chat history?`)) return
    await api.delete(`/bands/${id}`)
    navigate('/bands')
  }

  return (
    <div className="band-layout">
      <section className="chat-main">
        <div className="chat-header">
          <Link to="/bands" className="back-link visible">
            ←
          </Link>
          <div className="chat-title">
            <span className="band-icon">🎵</span>
            <div>
              <strong>{band.name}</strong>
              <small>{band.members.map((m) => m.name).join(', ')}</small>
            </div>
          </div>
        </div>
        <ChatWindow
          endpoint={`/bands/${id}/messages`}
          event="band_message"
          belongs={(m) => m.band_id === Number(id)}
          showSender
        />
      </section>

      <aside className="panel band-info">
        <h3>{band.name}</h3>
        {band.description && <p className="muted">{band.description}</p>}

        <h4>Members ({band.members.length})</h4>
        <ul className="member-list">
          {band.members.map((member) => (
            <li key={member.id}>
              <Link to={`/users/${member.id}`}>
                <Avatar user={member} size={32} /> {member.name}
              </Link>
              {member.id === band.owner_id && <span className="tag">owner</span>}
              {isOwner && member.id !== user.id && (
                <button className="link-button danger small" onClick={() => removeMember(member)}>
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {band.pending_invites.length > 0 && (
          <>
            <h4>Invited</h4>
            <ul className="member-list muted">
              {band.pending_invites.map((invitee) => (
                <li key={invitee.id}>
                  <Avatar user={invitee} size={32} /> {invitee.name}
                </li>
              ))}
            </ul>
          </>
        )}

        <h4>Invite a friend</h4>
        <InviteFriends bandId={band.id} excludeIds={taken} onInvited={load} />
        {error && <p className="error">{error}</p>}

        <div className="band-buttons">
          <button className="btn" onClick={leave}>
            Leave band
          </button>
          {isOwner && (
            <button className="btn danger" onClick={deleteBand}>
              Delete band
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
