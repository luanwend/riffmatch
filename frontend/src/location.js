const BASE_URL = 'https://countriesnow.space/api/v0.1/countries'
const cache = {}

async function request(path, body) {
  const key = path + JSON.stringify(body || {})
  if (!cache[key]) {
    cache[key] = fetch(BASE_URL + path, body && {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.msg)
        return json.data
      })
      .catch((err) => {
        delete cache[key]
        throw err
      })
  }
  return cache[key]
}

export async function getCountries() {
  const data = await request('/iso')
  return data.map((country) => country.name)
}

export async function getStates(country) {
  const data = await request('/states', { country })
  return data.states.map((state) => state.name)
}

export function getCities(country, state) {
  return request('/state/cities', { country, state })
}
