import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="logo big">🎸 Riffmatch</h1>
        <p className="muted">Swipe, match and start your next band.</p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary full">Log in</button>
        </form>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
