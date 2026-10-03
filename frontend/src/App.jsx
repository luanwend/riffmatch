import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Navbar from './components/Navbar'
import BandDetail from './pages/BandDetail'
import Bands from './pages/Bands'
import Chats from './pages/Chats'
import Discover from './pages/Discover'
import EditProfile from './pages/EditProfile'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import Register from './pages/Register'
import UserProfile from './pages/UserProfile'

function Layout() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="page-center">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Discover />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/:friendId" element={<Chats />} />
        <Route path="/bands" element={<Bands />} />
        <Route path="/bands/:id" element={<BandDetail />} />
        <Route path="/profile" element={<EditProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
