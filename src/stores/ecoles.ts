import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import type { IEcole, IEcoleForm } from '@/types'

interface EcolesState {
  ecoles: IEcole[]
  currentEcole: IEcole | null
  loading: boolean
  error: string | null
}

export const useEcolesStore = defineStore('ecoles', {
  state: (): EcolesState => ({
    ecoles: [],
    currentEcole: null,
    loading: false,
    error: null,
  }),

  getters: {
    totalEcoles: (state): number => state.ecoles.length,

    searchEcoles: (state) => (searchTerm: string): IEcole[] => {
      if (!searchTerm) return state.ecoles
      const term = searchTerm.toLowerCase()
      return state.ecoles.filter(
        (e) =>
          e.nomEcole.toLowerCase().includes(term) ||
          e.adresseEcole?.toLowerCase().includes(term) ||
          e.villeEcole?.toLowerCase().includes(term) ||
          e.contactReferent?.toLowerCase().includes(term)
      )
    },
  },

  actions: {
    async fetchAll(withStagiaires = true) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get<IEcole[]>('/ecoles', {
          params: { withStagiaires }
        })
        this.ecoles = response.data
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
        const response = await api.get<IEcole>(`/ecoles/${id}`)
        this.currentEcole = response.data
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors du chargement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async create(ecole: IEcoleForm) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post<IEcole>('/ecoles', ecole)
        this.ecoles.push(response.data)
        ElMessage.success('École créée avec succès')
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la création'
        throw error
      } finally {
        this.loading = false
      }
    },

    async update(id: number, ecole: Partial<IEcoleForm>) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put<IEcole>(`/ecoles/${id}`, ecole)
        const index = this.ecoles.findIndex((e) => e.idEcole === id)
        if (index !== -1) {
          this.ecoles[index] = response.data
        }
        ElMessage.success('École modifiée avec succès')
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
        await api.delete(`/ecoles/${id}`)
        this.ecoles = this.ecoles.filter((e) => e.idEcole !== id)
        ElMessage.success('École supprimée avec succès')
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la suppression'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
