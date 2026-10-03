import { photoUrl } from '../api'

export default function Avatar({ user, size = 40 }) {
  const url = photoUrl(user?.photo)
  const style = { width: size, height: size, fontSize: size / 2.4 }

  if (url) return <img className="avatar" src={url} alt={user.name} style={style} />
  return (
    <span className="avatar initials" style={style}>
      {user?.name?.[0]?.toUpperCase() || '?'}
    </span>
  )
}
