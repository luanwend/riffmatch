export const RANGE_LABELS = {
  city: 'your city',
  state: 'your state',
  country: 'your country',
}

export const RANGE_OPTIONS = {
  city: 'My city',
  state: 'My state',
  country: 'My country',
}

export const BAND_TYPE_LABELS = {
  cover: 'Cover bands',
  original: 'Original music',
  both: 'Cover & original',
}

export function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function notificationText(n) {
  const actor = n.actor.name
  switch (n.type) {
    case 'like':
      return `${actor} liked your profile`
    case 'match':
      return `You and ${actor} are now friends`
    case 'band_invite':
      return `${actor} invited you to join ${n.band?.name}`
    case 'band_join':
      return `${actor} joined ${n.band?.name}`
    default:
      return 'New notification'
  }
}

export function formatTime(iso) {
  const date = new Date(iso)
  const today = new Date().toDateString() === date.toDateString()
  return today
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: '2-digit', month: 'short' }) +
        ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
