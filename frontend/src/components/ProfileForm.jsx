import { useState } from 'react'
import { errorMessage, photoUrl, useOptions } from '../api'
import { BAND_TYPE_LABELS, RANGE_OPTIONS } from '../utils'
import GenrePicker from './GenrePicker'
import LocationPicker from './LocationPicker'

const STEPS = ['About you', 'Music', 'Band', 'Location']

function initialForm(user) {
  return {
    name: user?.name || '',
    email: '',
    password: '',
    birth_date: user?.birth_date || '',
    description: user?.description || '',
    instruments: user?.instruments || [],
    genres: user?.genres || [],
    artists: [0, 1, 2].map((i) => user?.artists?.[i] || ''),
    band_type: user?.band_type || 'original',
    cover_bands: [0, 1, 2].map((i) => user?.cover_bands?.[i] || ''),
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    search_range: user?.search_range || 'city',
  }
}

function maxBirthDate() {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().slice(0, 10)
}

export default function ProfileForm({ user, isRegister, submitLabel, onSubmit }) {
  const options = useOptions()
  const [form, setForm] = useState(() => initialForm(user))
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(photoUrl(user?.photo))
  const [step, setStep] = useState(0)
  const [otherInstrument, setOtherInstrument] = useState('')
  const [showOther, setShowOther] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const setListItem = (field, index, value) =>
    setForm((f) => ({ ...f, [field]: f[field].map((item, i) => (i === index ? value : item)) }))

  function addInstrument(name) {
    const value = name.trim()
    if (value && !form.instruments.includes(value)) set('instruments', [...form.instruments, value])
  }

  function handleInstrumentSelect(e) {
    if (e.target.value === 'Other') setShowOther(true)
    else addInstrument(e.target.value)
  }

  function addOtherInstrument() {
    addInstrument(otherInstrument)
    setOtherInstrument('')
    setShowOther(false)
  }

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  function validateStep() {
    if (step === 0) {
      if (isRegister && !photo) return 'Add a profile photo.'
      if (!form.name.trim()) return 'Tell us your name.'
      if (isRegister && !form.email.includes('@')) return 'Enter a valid email.'
      if (isRegister && form.password.length < 6) return 'The password must have at least 6 characters.'
      if (!form.birth_date) return 'Enter your birth date.'
    }
    if (step === 1) {
      if (!form.instruments.length) return 'Pick at least one instrument.'
      if (!form.genres.length) return 'Pick at least one genre.'
    }
    if (step === 3 && !(form.country && form.state && form.city)) return 'Choose your country, state and city.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const problem = validateStep()
    setError(problem)
    if (problem) return
    if (isRegister && step < STEPS.length - 1) return setStep(step + 1)

    const data = {
      ...form,
      artists: form.artists.filter((artist) => artist.trim()),
      cover_bands: form.band_type === 'original' ? [] : form.cover_bands.filter((band) => band.trim()),
    }
    if (!isRegister) {
      delete data.email
      delete data.password
    }

    setSaving(true)
    try {
      await onSubmit(data, photo)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function goToStep(index) {
    if (isRegister && index > step) return
    setError('')
    setStep(index)
  }

  if (!options) return <p className="muted">Loading...</p>

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="steps">
        {STEPS.map((label, i) => (
          <button
            type="button"
            key={label}
            className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => goToStep(i)}
          >
            <span>{i + 1}</span> {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <>
          <label className="photo-upload">
            {preview ? <img src={preview} alt="Profile preview" /> : <span>+ Add photo</span>}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} hidden />
          </label>
          <label className="field">
            <span>Name</span>
            <input value={form.name} maxLength={80} onChange={(e) => set('name', e.target.value)} />
          </label>
          {isRegister && (
            <>
              <label className="field">
                <span>Email</span>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </label>
            </>
          )}
          <label className="field">
            <span>Birth date</span>
            <input
              type="date"
              max={maxBirthDate()}
              value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)}
            />
          </label>
          <label className="field">
            <span>About you</span>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Your experience, goals, gear, availability..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
        </>
      )}

      {step === 1 && (
        <>
          <div className="field">
            <span>Instruments you play</span>
            {form.instruments.length > 0 && (
              <div className="chips">
                {form.instruments.map((name) => (
                  <button
                    type="button"
                    key={name}
                    className="chip active"
                    onClick={() => set('instruments', form.instruments.filter((i) => i !== name))}
                  >
                    {name} ✕
                  </button>
                ))}
              </div>
            )}
            <select value="" onChange={handleInstrumentSelect}>
              <option value="">Add an instrument...</option>
              {options.instruments
                .filter((name) => !form.instruments.includes(name))
                .map((name) => (
                  <option key={name}>{name}</option>
                ))}
              <option value="Other">Other...</option>
            </select>
            {showOther && (
              <div className="inline">
                <input
                  autoFocus
                  placeholder="Instrument name"
                  value={otherInstrument}
                  onChange={(e) => setOtherInstrument(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addOtherInstrument()
                    }
                  }}
                />
                <button type="button" className="btn" onClick={addOtherInstrument}>
                  Add
                </button>
              </div>
            )}
          </div>
          <div className="field">
            <span>Favorite genres ({form.genres.length}/5)</span>
            <GenrePicker groups={options.genres} selected={form.genres} onChange={(g) => set('genres', g)} max={5} />
          </div>
          <div className="field">
            <span>Favorite artists (up to 3)</span>
            {form.artists.map((artist, i) => (
              <input
                key={i}
                placeholder={`Artist ${i + 1}`}
                value={artist}
                onChange={(e) => setListItem('artists', i, e.target.value)}
              />
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="field">
            <span>What kind of band are you looking for?</span>
            <div className="radio-cards">
              {Object.entries(BAND_TYPE_LABELS).map(([value, label]) => (
                <label key={value} className={`radio-card ${form.band_type === value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="band_type"
                    checked={form.band_type === value}
                    onChange={() => set('band_type', value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          {form.band_type !== 'original' && (
            <div className="field">
              <span>Bands you would like to cover (up to 3)</span>
              {form.cover_bands.map((band, i) => (
                <input
                  key={i}
                  list="cover-suggestions"
                  placeholder={`Band ${i + 1}`}
                  value={band}
                  onChange={(e) => setListItem('cover_bands', i, e.target.value)}
                />
              ))}
              <datalist id="cover-suggestions">
                {options.cover_bands.map((band) => (
                  <option key={band} value={band} />
                ))}
              </datalist>
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <LocationPicker
            value={{ country: form.country, state: form.state, city: form.city }}
            onChange={(location) => setForm((f) => ({ ...f, ...location }))}
          />
          <div className="field">
            <span>Find musicians in</span>
            <div className="radio-cards">
              {Object.entries(RANGE_OPTIONS).map(([value, label]) => (
                <label key={value} className={`radio-card ${form.search_range === value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="search_range"
                    checked={form.search_range === value}
                    onChange={() => set('search_range', value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        {step > 0 && (
          <button type="button" className="btn" onClick={() => goToStep(step - 1)}>
            Back
          </button>
        )}
        {!isRegister && step < STEPS.length - 1 && (
          <button type="button" className="btn" onClick={() => goToStep(step + 1)}>
            Next
          </button>
        )}
        <button className="btn primary" disabled={saving}>
          {isRegister && step < STEPS.length - 1 ? 'Next' : saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
