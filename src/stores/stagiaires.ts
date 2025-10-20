import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import type { IStagiaire, IStagiaireForm } from '@/types'

interface StagiairesState {
  stagiaires: IStagiaire[]
  currentStagiaire: IStagiaire | null
  loading: boolean
  error: string | null
}

export const useStagiairesStore = defineStore('stagiaires', {
  state: (): StagiairesState => ({
    stagiaires: [],
    currentStagiaire: null,
    loading: false,
    error: null,
  }),

  getters: {
    totalStagiaires: (state): number => state.stagiaires.length,

    activeStagiaires: (state): IStagiaire[] => {
      // Filter active stagiaires (you can add a status field if needed)
      return state.stagiaires
    },

    searchStagiaires: (state) => (searchTerm: string): IStagiaire[] => {
      if (!searchTerm) return state.stagiaires
      const term = searchTerm.toLowerCase()
      return state.stagiaires.filter(
        (s) =>
          s.nomStagiaire.toLowerCase().includes(term) ||
          s.prenomStagiaire.toLowerCase().includes(term) ||
          s.mailStagiaire.toLowerCase().includes(term) ||
          s.ecole?.nomEcole.toLowerCase().includes(term)
      )
    },

    stagiairesByEcole: (state) => (idEcole: number): IStagiaire[] => {
      return state.stagiaires.filter((s) => s.idEcole === idEcole)
    },
  },

  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get<IStagiaire[]>('/stagiaires')
        this.stagiaires = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors du chargement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchOne(id: number) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get<IStagiaire>(`/stagiaires/${id}`)
        this.currentStagiaire = response.data
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors du chargement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async create(stagiaire: IStagiaireForm) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post<IStagiaire>('/stagiaires', stagiaire)
        this.stagiaires.push(response.data)
        ElMessage.success('Stagiaire créé avec succès')
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la création'
        throw error
      } finally {
        this.loading = false
      }
    },

    async update(id: number, stagiaire: Partial<IStagiaireForm>) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put<IStagiaire>(`/stagiaires/${id}`, stagiaire)
        const index = this.stagiaires.findIndex((s) => s.idStagiaire === id)
        if (index !== -1) {
          this.stagiaires[index] = response.data
        }
        ElMessage.success('Stagiaire modifié avec succès')
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la modification'
        throw error
      } finally {
        this.loading = false
      }
    },

    async delete(id: number) {
      this.loading = true
      this.error = null
      try {
        await api.delete(`/stagiaires/${id}`)
        this.stagiaires = this.stagiaires.filter((s) => s.idStagiaire !== id)
        ElMessage.success('Stagiaire supprimé avec succès')
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la suppression'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
