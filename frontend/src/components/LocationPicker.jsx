import { useEffect, useState } from 'react'
import { getCities, getCountries, getStates } from '../location'

function useList(load, deps) {
  const [list, setList] = useState({ items: [], loading: false, failed: false })

  useEffect(() => {
    if (!load) {
      setList({ items: [], loading: false, failed: false })
      return
    }
    let active = true
    setList({ items: [], loading: true, failed: false })
    load()
      .then((items) => active && setList({ items, loading: false, failed: false }))
      .catch(() => active && setList({ items: [], loading: false, failed: true }))
    return () => {
      active = false
    }
  }, deps)

  return list
}

function LocationField({ label, value, list, manual, disabled, onChange }) {
  const typing = manual || (!disabled && !list.loading && list.items.length === 0)
  const items = value && !list.items.includes(value) ? [value, ...list.items] : list.items

  return (
    <label className="field">
      <span>{label}</span>
      {typing ? (
        <input value={value} placeholder={label} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <select value={value} disabled={disabled || list.loading} onChange={(e) => onChange(e.target.value)}>
          <option value="">{list.loading ? 'Loading...' : `Select ${label.toLowerCase()}`}</option>
          {items.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      )}
    </label>
  )
}

export default function LocationPicker({ value, onChange }) {
  const [manual, setManual] = useState(false)
  const { country, state, city } = value

  const countries = useList(manual ? null : getCountries, [manual])
  const states = useList(manual || !country ? null : () => getStates(country), [manual, country])
  const cities = useList(manual || !state ? null : () => getCities(country, state), [manual, country, state])
  const isManual = manual || countries.failed

  return (
    <div className="location-picker">
      <LocationField
        label="Country"
        value={country}
        list={countries}
        manual={isManual}
        onChange={(newCountry) => onChange({ country: newCountry, state: '', city: '' })}
      />
      <LocationField
        label="State"
        value={state}
        list={states}
        manual={isManual}
        disabled={!country}
        onChange={(newState) => onChange({ country, state: newState, city: '' })}
      />
      <LocationField
        label="City"
        value={city}
        list={cities}
        manual={isManual}
        disabled={!state}
        onChange={(newCity) => onChange({ country, state, city: newCity })}
      />
      {!countries.failed && (
        <button type="button" className="link-button small" onClick={() => setManual(!manual)}>
          {manual ? 'Choose from the list' : "Can't find your location? Type it instead"}
        </button>
      )}
    </div>
  )
}
