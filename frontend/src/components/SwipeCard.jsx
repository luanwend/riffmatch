import { useRef, useState } from 'react'
import { photoUrl } from '../api'

const THRESHOLD = 120

export default function SwipeCard({ user, isTop, depth, leaving, onSwipe, onOpen }) {
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const start = useRef(null)

  function handlePointerDown(e) {
    if (!isTop || leaving) return
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!start.current) return
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }

  function handlePointerUp() {
    if (!start.current) return
    start.current = null
    if (Math.abs(drag.x) > THRESHOLD) return onSwipe(drag.x > 0 ? 'like' : 'pass')
    if (Math.abs(drag.x) < 5 && Math.abs(drag.y) < 5) onOpen()
    setDrag({ x: 0, y: 0 })
  }

  let transform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 15}deg)`
  if (leaving) {
    const direction = leaving === 'like' ? 1 : -1
    transform = `translate(${direction * 150}%, ${drag.y}px) rotate(${direction * 30}deg)`
  } else if (!isTop) {
    transform = `scale(${1 - depth * 0.04}) translateY(${depth * 14}px)`
  }

  const dragging = start.current !== null

  return (
    <div
      className={`swipe-card ${dragging ? 'dragging' : ''}`}
      style={{ transform, zIndex: 10 - depth }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {user.photo ? (
        <img src={photoUrl(user.photo)} alt={user.name} draggable={false} />
      ) : (
        <div className="card-placeholder">{user.name[0]}</div>
      )}
      {(drag.x > 40 || leaving === 'like') && <span className="stamp like">LIKE</span>}
      {(drag.x < -40 || leaving === 'pass') && <span className="stamp nope">NOPE</span>}
      <div className="card-info">
        <h3>
          {user.name} <span>{user.age}</span>
        </h3>
        <p className="card-meta">
          {user.instruments.join(' · ')} — {user.city}
        </p>
        <div className="tags">
          {user.genres.map((genre) => (
            <span key={genre} className="tag">
              {genre}
            </span>
          ))}
        </div>
        {user.description && <p className="card-description">{user.description}</p>}
      </div>
    </div>
  )
}
