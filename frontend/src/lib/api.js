import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('docmind_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('docmind_refresh_token')

      if (refreshToken && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return api(originalRequest)
            })
            .catch(err => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          const { token: newToken, refreshToken: newRefreshToken, user } = res.data

          localStorage.setItem('docmind_token', newToken)
          if (newRefreshToken) localStorage.setItem('docmind_refresh_token', newRefreshToken)
          if (user) localStorage.setItem('docmind_user', JSON.stringify(user))

          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch (refreshErr) {
          processQueue(refreshErr, null)
          localStorage.removeItem('docmind_token')
          localStorage.removeItem('docmind_refresh_token')
          localStorage.removeItem('docmind_user')
          window.location.href = '/login'
          return Promise.reject(refreshErr)
        } finally {
          isRefreshing = false
        }
      } else {
        localStorage.removeItem('docmind_token')
        localStorage.removeItem('docmind_refresh_token')
        localStorage.removeItem('docmind_user')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

export default api
