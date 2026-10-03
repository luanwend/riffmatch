import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage, photoUrl } from '../api'
import { BAND_TYPE_LABELS } from '../utils'

function TagSection({ title, items }) {
  if (!items.length) return null
  return (
    <div className="profile-section">
      <h4>{title}</h4>
      <div className="tags">
        {items.map((item) => (
          <span key={item} className="tag">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    api.get(`/users/${id}`)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(errorMessage(err)))
  }, [id])

  useEffect(load, [load])

  async function swipe(action) {
    try {
      const res = await api.post('/swipes', { target_id: profile.id, action })
      if (action === 'pass') return navigate('/')
      setMessage(
        res.data.matched
          ? `It's a match! You and ${profile.name} are now friends.`
          : 'Like sent! You will be notified if they accept.'
      )
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function unfriend() {
    if (!window.confirm(`Remove ${profile.name} from your friends?`)) return
    await api.delete(`/friends/${profile.id}`)
    setMessage('')
    load()
  }

  if (error) return <p className="error">{error}</p>
  if (!profile) return <p className="muted">Loading...</p>

  return (
    <div className="profile-page">
      <button className="link-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="profile-card">
        <div className="profile-photo">
          {profile.photo ? (
            <img src={photoUrl(profile.photo)} alt={profile.name} />
          ) : (
            <div className="card-placeholder">{profile.name[0]}</div>
          )}
        </div>
        <div className="profile-body">
          <h2>
            {profile.name}, {profile.age}
          </h2>
          <p className="muted">
            📍 {profile.city}, {profile.state} · {profile.country}
          </p>
          {profile.liked_me && !profile.is_friend && (
            <p className="highlight">💌 {profile.name} liked you! Like back to match.</p>
          )}
          {profile.description && <p className="description">{profile.description}</p>}
          <TagSection title="Instruments" items={profile.instruments} />
          <TagSection title="Genres" items={profile.genres} />
          <TagSection title="Favorite artists" items={profile.artists} />
          <div className="profile-section">
            <h4>Looking for</h4>
            <p>{BAND_TYPE_LABELS[profile.band_type]}</p>
          </div>
          <TagSection title="Wants to cover" items={profile.cover_bands} />

          {message && <p className="success">{message}</p>}
          <div className="profile-actions">
            {profile.is_me ? (
              <Link to="/profile" className="btn primary">
                Edit profile
              </Link>
            ) : profile.is_friend ? (
              <>
                <Link to={`/chats/${profile.id}`} className="btn primary">
                  Message
                </Link>
                <button className="btn danger" onClick={unfriend}>
                  Unfriend
                </button>
              </>
            ) : profile.my_swipe === 'like' ? (
              <p className="muted">Like sent. Waiting for {profile.name} to answer.</p>
            ) : (
              <>
                <button className="btn" onClick={() => swipe('pass')}>
                  ✕ Pass
                </button>
                <button className="btn primary" onClick={() => swipe('like')}>
                  ♥ Like
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
