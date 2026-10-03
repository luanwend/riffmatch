import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { toFormData } from '../api'
import { useAuth } from '../AuthContext'
import ProfileForm from '../components/ProfileForm'

export default function EditProfile() {
  const { user, setUser } = useAuth()
  const [saved, setSaved] = useState(false)

  async function handleSubmit(data, photo) {
    const res = await api.put('/users/me', toFormData(data, photo))
    setUser(res.data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="panel narrow">
      <div className="page-header">
        <h2>Your profile</h2>
        <Link to={`/users/${user.id}`} className="btn">
          View public profile
        </Link>
      </div>
      <ProfileForm user={user} submitLabel="Save changes" onSubmit={handleSubmit} />
      {saved && <p className="success">Profile saved!</p>}
    </div>
  )
}
