import { useState } from 'react'
import api, { errorMessage } from '../api'
import { useAuth } from '../AuthContext'
import { RANGE_OPTIONS } from '../utils'
import Modal from './Modal'

export default function RangeModal({ onClose }) {
  const { user, setUser } = useAuth()
  const [range, setRange] = useState(user.search_range)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const places = { city: user.city, state: user.state, country: user.country }

  async function save() {
    setSaving(true)
    try {
      const res = await api.patch('/users/me/range', { search_range: range })
      setUser(res.data)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal title="Search range" onClose={onClose}>
      <p className="muted">Show musicians from:</p>
      <div className="radio-cards">
        {Object.entries(RANGE_OPTIONS).map(([value, label]) => (
          <label key={value} className={`radio-card ${range === value ? 'active' : ''}`}>
            <input type="radio" name="range" checked={range === value} onChange={() => setRange(value)} />
            {label}
            <small>{places[value]}</small>
          </label>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn primary" disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}
