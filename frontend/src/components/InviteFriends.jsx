import { useEffect, useState } from 'react'
import api, { errorMessage } from '../api'
import { normalize } from '../utils'
import Avatar from './Avatar'

export default function InviteFriends({ bandId, excludeIds, onInvited }) {
  const [friends, setFriends] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/friends').then((res) => setFriends(res.data.friends))
  }, [])

  const term = normalize(search.trim())
  const results = friends.filter((f) => !excludeIds.includes(f.id) && normalize(f.name).includes(term))

  async function invite(friend) {
    try {
      await api.post(`/bands/${bandId}/invite`, { user_id: friend.id })
      setMessage(`Invite sent to ${friend.name}!`)
      setError('')
      setSearch('')
      onInvited()
    } catch (err) {
      setMessage('')
      setError(errorMessage(err))
    }
  }

  return (
    <div className="invite-friends">
      <input placeholder="Search friends by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul className="invite-results">
        {results.map((friend) => (
          <li key={friend.id}>
            <Avatar user={friend} size={32} />
            <span className="grow">{friend.name}</span>
            <button type="button" className="btn small primary" onClick={() => invite(friend)}>
              Invite
            </button>
          </li>
        ))}
      </ul>
      {results.length === 0 && (
        <p className="muted small">{search ? 'No friends match this name.' : 'No friends left to invite.'}</p>
      )}
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
