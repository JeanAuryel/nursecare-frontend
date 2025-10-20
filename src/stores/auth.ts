import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'
import type { LoginCredentials, RoleEmploye } from '@/types'
import { ElMessage } from 'element-plus'

interface User {
  id: number
  nom: string
  prenom: string
  role: RoleEmploye
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: false
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: authService.getUser(),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Obtenir le nom complet de l'utilisateur
     */
    fullName: (state): string => {
      return state.user ? `${state.user.prenom} ${state.user.nom}` : ''
    },

    /**
     * Obtenir le rôle de l'utilisateur
     */
    userRole: (state): RoleEmploye | null => {
      return state.user?.role || null
    },

    /**
     * Vérifier si l'utilisateur est directeur
     */
    isDirecteur: (state): boolean => {
      return state.user?.role === 'DIRECTEUR'
    },

    /**
     * Vérifier si l'utilisateur est secrétaire
     */
    isSecretaire: (state): boolean => {
      return state.user?.role === 'SECRETAIRE'
    },

    /**
     * Vérifier si l'utilisateur est infirmier
     */
    isInfirmier: (state): boolean => {
      return state.user?.role === 'INFIRMIER'
    },
  },

  actions: {
    /**
     * Connexion utilisateur
     */
    async login(credentials: LoginCredentials) {
      this.loading = true
      this.error = null

      try {
        const response = await authService.login(credentials)
        authService.saveAuthData(response)

        this.user = response.employe
        this.isAuthenticated = true

        ElMessage.success('Connexion réussie !')
        return response
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur de connexion'
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Déconnexion utilisateur
     */
    logout() {
      authService.logout()
      this.user = null
      this.isAuthenticated = false
      ElMessage.info('Déconnexion réussie')
    },

    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     */
    hasRole(role: RoleEmploye | RoleEmploye[]): boolean {
      if (!this.user) return false

      if (Array.isArray(role)) {
        return role.includes(this.user.role)
      }

      return this.user.role === role
    },

    /**
     * Initialiser l'état d'authentification depuis le localStorage
     */
    initAuth() {
      this.user = authService.getUser()
      this.isAuthenticated = authService.isAuthenticated()
    },
  },
})
