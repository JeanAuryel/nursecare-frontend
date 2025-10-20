import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import type { IPrestation, IPrestationForm } from '@/types'

interface PrestationsState {
  prestations: IPrestation[]
  currentPrestation: IPrestation | null
  loading: boolean
  error: string | null
}

export const usePrestationsStore = defineStore('prestations', {
  state: (): PrestationsState => ({
    prestations: [],
    currentPrestation: null,
    loading: false,
    error: null,
  }),

  getters: {
    totalPrestations: (state): number => state.prestations.length,

    searchPrestations: (state) => (searchTerm: string): IPrestation[] => {
      if (!searchTerm) return state.prestations
      const term = searchTerm.toLowerCase()
      return state.prestations.filter(
        (p) =>
          p.nomPrestation.toLowerCase().includes(term) ||
          p.categorie?.nomCategorie.toLowerCase().includes(term)
      )
    },

    prestationsByCategorie: (state) => (idCategorie: number): IPrestation[] => {
      return state.prestations.filter((p) => p.idCategorie === idCategorie)
    },
  },

  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get<IPrestation[]>('/prestations')
        this.prestations = response.data
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
        const response = await api.get<IPrestation>(`/prestations/${id}`)
        this.currentPrestation = response.data
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors du chargement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async create(prestation: IPrestationForm) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post<IPrestation>('/prestations', prestation)
        this.prestations.push(response.data)
        ElMessage.success('Prestation créée avec succès')
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la création'
        throw error
      } finally {
        this.loading = false
      }
    },

    async update(id: number, prestation: Partial<IPrestationForm>) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put<IPrestation>(`/prestations/${id}`, prestation)
        const index = this.prestations.findIndex((p) => p.idPrestation === id)
        if (index !== -1) {
          this.prestations[index] = response.data
        }
        ElMessage.success('Prestation modifiée avec succès')
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
        await api.delete(`/prestations/${id}`)
        this.prestations = this.prestations.filter((p) => p.idPrestation !== id)
        ElMessage.success('Prestation supprimée avec succès')
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la suppression'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
