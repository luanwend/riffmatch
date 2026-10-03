import { useEffect, useRef, useState } from 'react'

export default function KebabMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function choose(e, item) {
    e.stopPropagation()
    setOpen(false)
    item.onClick()
  }

  return (
    <div className="kebab" ref={ref}>
      <button
        type="button"
        className="kebab-button"
        title="Options"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
      >
        ⋮
      </button>
      {open && (
        <div className="kebab-menu">
          {items
            .filter((item) => !item.hidden)
            .map((item) => (
              <button
                type="button"
                key={item.label}
                className={item.danger ? 'danger' : ''}
                onClick={(e) => choose(e, item)}
              >
                {item.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
