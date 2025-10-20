import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

// Configuration de base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Instance Axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Pour les cookies
})

// Intercepteur de requête - Ajouter le token JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponse - Gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    // TEMPORAIRE : Désactiver le refresh automatique pour debug
    // TODO: Implémenter la route /api/auth/refresh côté backend

    // Si erreur 401, simplement logger sans déconnecter
    if (error.response?.status === 401) {
      console.warn('⚠️ Erreur 401 sur:', error.config?.url)
      console.warn('   Token présent:', !!localStorage.getItem('accessToken'))
    }

    // Gérer les autres erreurs
    return Promise.reject(error)
  }
)

// Helper pour gérer les erreurs
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>
    return axiosError.response?.data?.message || axiosError.message || 'Une erreur est survenue'
  }
  return 'Une erreur inconnue est survenue'
}

export default api
