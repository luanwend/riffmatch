import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import api from './api'
import { notificationText } from './utils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [socket, setSocket] = useState(null)
  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState(null)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  function login(newToken, newUser) {
    localStorage.setItem('token', newToken)
    setUser(newUser)
    setToken(newToken)
  }

  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if ([401, 422].includes(err.response?.status) && localStorage.getItem('token')) logout()
        return Promise.reject(err)
      }
    )
    return () => api.interceptors.response.eject(id)
  }, [logout])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(logout)
      .finally(() => setLoading(false))
    api.get('/notifications').then((res) => setUnread(res.data.unread)).catch(() => {})

    const newSocket = io({ auth: { token } })
    newSocket.on('notification', (notification) => {
      setUnread((count) => count + 1)
      setToast(notificationText(notification))
    })
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
    }
  }, [token, logout])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, socket, unread, setUnread }}>
      {children}
      {toast && (
        <div className="toast" onClick={() => setToast(null)}>
          🔔 {toast}
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
