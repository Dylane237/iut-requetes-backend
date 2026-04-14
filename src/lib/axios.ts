import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'//a modifier par l'url de l'api du dev 1

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur REQUEST — ajoute le token JWT à chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercepteur RESPONSE — gère le token expiré (401)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = Cookies.get('refresh_token')
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })

        const newAccessToken = response.data.access
        Cookies.set('access_token', newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh échoué → déconnexion
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance