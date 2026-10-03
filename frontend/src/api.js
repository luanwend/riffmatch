import axios from 'axios'
import { useEffect, useState } from 'react'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function errorMessage(err) {
  return err.response?.data?.error || err.response?.data?.msg || 'Something went wrong. Try again.'
}

export function photoUrl(photo) {
  if (!photo) return null
  return photo.startsWith('http') ? photo : `/uploads/${photo}`
}

export function toFormData(data, photo) {
  const formData = new FormData()
  formData.append('data', JSON.stringify(data))
  if (photo) formData.append('photo', photo)
  return formData
}

let optionsCache = null

export function useOptions() {
  const [options, setOptions] = useState(optionsCache)

  useEffect(() => {
    if (optionsCache) return
    api.get('/options').then((res) => {
      optionsCache = res.data
      setOptions(res.data)
    })
  }, [])

  return options
}

export default api
