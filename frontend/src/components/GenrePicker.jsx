import { useState } from 'react'

export default function GenrePicker({ groups, selected, onChange, max }) {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const full = Boolean(max) && selected.length >= max

  function toggle(genre) {
    if (selected.includes(genre)) onChange(selected.filter((g) => g !== genre))
    else if (!full) onChange([...selected, genre])
  }

  return (
    <div className="genre-picker">
      <input placeholder="Search genres..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="genre-groups">
        {groups.map(({ family, genres }) => {
          const visible = genres.filter(
            (genre) => genre.toLowerCase().includes(term) || family.toLowerCase().includes(term)
          )
          if (!visible.length) return null
          return (
            <div key={family}>
              <h4>{family}</h4>
              <div className="chips">
                {visible.map((genre) => {
                  const active = selected.includes(genre)
                  return (
                    <button
                      type="button"
                      key={genre}
                      className={`chip ${active ? 'active' : ''}`}
                      disabled={!active && full}
                      onClick={() => toggle(genre)}
                    >
                      {genre}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
