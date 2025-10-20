import api from './api'
import type { LoginCredentials, LoginResponse } from '@/types'

export const authService = {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },

  /**
   * Déconnexion utilisateur
   */
  logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  },

  /**
   * Obtenir le token actuel
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken')
  },

  /**
   * Sauvegarder les données de connexion
   */
  saveAuthData(data: LoginResponse) {
    console.log('💾 saveAuthData appelé avec:', data)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.employe))
    console.log('✅ Données sauvegardées dans localStorage')
    console.log('  - accessToken:', localStorage.getItem('accessToken')?.substring(0, 20) + '...')
    console.log('  - user:', localStorage.getItem('user'))
  },

  /**
   * Obtenir l'utilisateur connecté
   */
  getUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },
}
