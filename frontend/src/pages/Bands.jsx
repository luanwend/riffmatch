import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { useAuth } from '../AuthContext'
import InviteFriends from '../components/InviteFriends'
import KebabMenu from '../components/KebabMenu'
import Modal from '../components/Modal'

export default function Bands() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bands, setBands] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState(null)
  const [listError, setListError] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  function loadBands() {
    api.get('/bands')
      .then((res) => setBands(res.data.bands))
      .finally(() => setLoading(false))
  }

  useEffect(loadBands, [])

  async function runAction(question, request) {
    if (!window.confirm(question)) return
    try {
      await request()
      setListError('')
      loadBands()
    } catch (err) {
      setListError(errorMessage(err))
    }
  }

  async function createBand(e) {
    e.preventDefault()
    try {
      const res = await api.post('/bands', form)
      navigate(`/bands/${res.data.id}`)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const addingBand = bands.find((band) => band.id === addingTo)

  return (
    <div className="bands-page">
      <div className="panel">
        <h2>Your bands</h2>
        {!loading && bands.length === 0 && <p className="muted">You are not in any band yet.</p>}
        {listError && <p className="error">{listError}</p>}
        <ul className="band-list">
          {bands.map((band) => (
            <li key={band.id}>
              <Link to={`/bands/${band.id}`}>
                <span className="band-icon">🎵</span>
                <div>
                  <strong>{band.name}</strong>
                  <small>
                    {band.member_count} member{band.member_count === 1 ? '' : 's'}
                    {band.description && ` · ${band.description}`}
                  </small>
                </div>
              </Link>
              <KebabMenu
                items={[
                  { label: 'Add member', onClick: () => setAddingTo(band.id) },
                  {
                    label: 'Leave band',
                    onClick: () => runAction(`Leave ${band.name}?`, () => api.post(`/bands/${band.id}/leave`)),
                  },
                  {
                    label: 'Delete band',
                    danger: true,
                    hidden: band.owner_id !== user.id,
                    onClick: () =>
                      runAction(`Delete ${band.name} and its whole chat history?`, () =>
                        api.delete(`/bands/${band.id}`)
                      ),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      </div>

      <form className="panel" onSubmit={createBand}>
        <h2>Create a band</h2>
        <p className="muted">
          A band is a group chat. Invite your friends, and every member can invite their own friends too.
        </p>
        <label className="field">
          <span>Band name</span>
          <input maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            maxLength={300}
            placeholder="Style, goals, rehearsal schedule..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary full">Create band</button>
      </form>

      {addingBand && (
        <Modal title={`Add member to ${addingBand.name}`} onClose={() => setAddingTo(null)}>
          <InviteFriends
            bandId={addingBand.id}
            excludeIds={[...addingBand.member_ids, ...addingBand.invited_ids]}
            onInvited={loadBands}
          />
        </Modal>
      )}
    </div>
  )
}
