import { Link } from 'react-router-dom'
import api, { toFormData } from '../api'
import { useAuth } from '../AuthContext'
import ProfileForm from '../components/ProfileForm'

export default function Register() {
  const { login } = useAuth()

  async function handleSubmit(data, photo) {
    const res = await api.post('/auth/register', toFormData(data, photo))
    login(res.data.token, res.data.user)
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <h1 className="logo big">🎸 Riffmatch</h1>
        <p className="muted">Create your musician profile.</p>
        <ProfileForm isRegister submitLabel="Create account" onSubmit={handleSubmit} />
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
