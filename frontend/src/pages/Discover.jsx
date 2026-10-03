import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage, useOptions } from '../api'
import { useAuth } from '../AuthContext'
import Avatar from '../components/Avatar'
import GenrePicker from '../components/GenrePicker'
import RangeModal from '../components/RangeModal'
import SwipeCard from '../components/SwipeCard'
import { RANGE_LABELS } from '../utils'

export default function Discover() {
  const { user } = useAuth()
  const options = useOptions()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [genres, setGenres] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [showRange, setShowRange] = useState(false)
  const [leaving, setLeaving] = useState(null)
  const [match, setMatch] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/discover', { params: { genres: genres.join(',') } })
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [genres, user.search_range])

  function swipe(action) {
    const current = users[0]
    if (!current || leaving) return
    setLeaving(action)
    setTimeout(() => {
      setUsers((prev) => prev.slice(1))
      setLeaving(null)
    }, 250)
    api.post('/swipes', { target_id: current.id, action })
      .then((res) => res.data.matched && setMatch(current))
      .catch((err) => setError(errorMessage(err)))
  }

  const stack = users.slice(0, 3)

  return (
    <div className="discover">
      <div className="page-header">
        <div>
          <h2>Discover</h2>
          <p className="muted">
            Musicians in {RANGE_LABELS[user.search_range]} ·{' '}
            <button className="link-button accent" onClick={() => setShowRange(true)}>
              change
            </button>
          </p>
        </div>
        <button className={`btn ${genres.length ? 'primary' : ''}`} onClick={() => setShowFilter(!showFilter)}>
          Genres {genres.length > 0 && `(${genres.length})`}
        </button>
      </div>

      {showFilter && options && (
        <div className="panel filter-panel">
          <GenrePicker groups={options.genres} selected={genres} onChange={setGenres} />
          <div className="form-actions">
            <button className="btn" onClick={() => setGenres([])}>
              Clear
            </button>
            <button className="btn primary" onClick={() => setShowFilter(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="card-stack">
        {loading ? (
          <div className="empty-card">Looking for musicians...</div>
        ) : stack.length === 0 ? (
          <div className="empty-card">
            <p>🎧 No more musicians around.</p>
            <p className="muted">Try a wider search range or other genres.</p>
          </div>
        ) : (
          stack
            .map((person, index) => (
              <SwipeCard
                key={person.id}
                user={person}
                depth={index}
                isTop={index === 0}
                leaving={index === 0 ? leaving : null}
                onSwipe={swipe}
                onOpen={() => navigate(`/users/${person.id}`)}
              />
            ))
            .reverse()
        )}
      </div>

      <div className="swipe-actions">
        <button className="round pass" title="Pass" onClick={() => swipe('pass')} disabled={!users.length}>
          ✕
        </button>
        <button
          className="round info"
          title="View profile"
          onClick={() => users[0] && navigate(`/users/${users[0].id}`)}
          disabled={!users.length}
        >
          i
        </button>
        <button className="round like" title="Like" onClick={() => swipe('like')} disabled={!users.length}>
          ♥
        </button>
      </div>

      {match && (
        <div className="modal-backdrop" onClick={() => setMatch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="gradient-text">It's a match!</h2>
            <div className="match-avatars">
              <Avatar user={user} size={90} />
              <Avatar user={match} size={90} />
            </div>
            <p>You and {match.name} liked each other and are now friends.</p>
            <div className="form-actions">
              <button className="btn" onClick={() => setMatch(null)}>
                Keep swiping
              </button>
              <button className="btn primary" onClick={() => navigate(`/chats/${match.id}`)}>
                Send a message
              </button>
            </div>
          </div>
        </div>
      )}

      {showRange && <RangeModal onClose={() => setShowRange(false)} />}
    </div>
  )
}
