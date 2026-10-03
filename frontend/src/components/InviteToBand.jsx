import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api'

export default function InviteToBand({ friend }) {
  const [bands, setBands] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.get('/bands').then((res) => setBands(res.data.bands))
  }

  useEffect(load, [])

  async function invite(band) {
    try {
      await api.post(`/bands/${band.id}/invite`, { user_id: friend.id })
      setError('')
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!bands) return <p className="muted">Loading...</p>
  if (!bands.length) {
    return (
      <p className="muted">
        You are not in any band yet. <Link to="/bands">Create one</Link>
      </p>
    )
  }

  return (
    <>
      <ul className="invite-results">
        {bands.map((band) => (
          <li key={band.id}>
            <span className="band-icon small">🎵</span>
            <span className="grow">{band.name}</span>
            {band.member_ids.includes(friend.id) ? (
              <span className="tag">Member</span>
            ) : band.invited_ids.includes(friend.id) ? (
              <span className="tag">Invited</span>
            ) : (
              <button type="button" className="btn small primary" onClick={() => invite(band)}>
                Invite
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="error">{error}</p>}
    </>
  )
}
