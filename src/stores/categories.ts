import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import type { ICategorie, ICategorieForm } from '@/types'

interface CategoriesState {
  categories: ICategorie[]
  currentCategorie: ICategorie | null
  loading: boolean
  error: string | null
}

export const useCategoriesStore = defineStore('categories', {
  state: (): CategoriesState => ({
    categories: [],
    currentCategorie: null,
    loading: false,
    error: null,
  }),

  getters: {
    totalCategories: (state): number => state.categories.length,

    searchCategories: (state) => (searchTerm: string): ICategorie[] => {
      if (!searchTerm) return state.categories
      const term = searchTerm.toLowerCase()
      return state.categories.filter((c) =>
        c.nomCategorie.toLowerCase().includes(term)
      )
    },
  },

  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get<ICategorie[]>('/categories')
        this.categories = response.data
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
        const response = await api.get<ICategorie>(`/categories/${id}`)
        this.currentCategorie = response.data
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors du chargement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async create(categorie: ICategorieForm) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post<ICategorie>('/categories', categorie)
        this.categories.push(response.data)
        ElMessage.success('Catégorie créée avec succès')
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la création'
        throw error
      } finally {
        this.loading = false
      }
    },

    async update(id: number, categorie: Partial<ICategorieForm>) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put<ICategorie>(`/categories/${id}`, categorie)
        const index = this.categories.findIndex((c) => c.idCategorie === id)
        if (index !== -1) {
          this.categories[index] = response.data
        }
        ElMessage.success('Catégorie modifiée avec succès')
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
        await api.delete(`/categories/${id}`)
        this.categories = this.categories.filter((c) => c.idCategorie !== id)
        ElMessage.success('Catégorie supprimée avec succès')
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Erreur lors de la suppression'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
