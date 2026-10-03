import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, logout, unread } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        🎸 Riffmatch
      </Link>
      <nav>
        <NavLink to="/" end>
          Discover
        </NavLink>
        <NavLink to="/notifications">
          Notifications {unread > 0 && <span className="badge">{unread}</span>}
        </NavLink>
        <NavLink to="/chats">Chats</NavLink>
        <NavLink to="/bands">Bands</NavLink>
        <NavLink to="/profile" className="nav-profile">
          <Avatar user={user} size={26} /> Profile
        </NavLink>
        <button className="link-button" onClick={logout}>
          Log out
        </button>
      </nav>
    </header>
  )
}
