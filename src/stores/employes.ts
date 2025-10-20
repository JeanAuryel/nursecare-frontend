import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export enum RoleEmploye {
  DIRECTEUR = 'DIRECTEUR',
  SECRETAIRE = 'SECRETAIRE',
  INFIRMIER = 'INFIRMIER'
}

export interface IEmploye {
  idEmploye?: number
  nomEmploye: string
  prenomEmploye: string
  mailEmploye: string
  mdpEmploye?: string
  roleEmploye: RoleEmploye
}

export interface IEmployeSafe {
  idEmploye: number
  nomEmploye: string
  prenomEmploye: string
  mailEmploye: string
  roleEmploye: RoleEmploye
}

export const useEmployesStore = defineStore('employes', () => {
  const employes = ref<IEmployeSafe[]>([])
  const currentEmploye = ref<IEmployeSafe | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Récupérer tous les employés
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${API_URL}/employes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      employes.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des employés'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Récupérer un employé par email
  async function fetchByEmail(email: string) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${API_URL}/employes/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      currentEmploye.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de l\'employé'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Récupérer les employés par rôle
  async function fetchByRole(role: RoleEmploye) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${API_URL}/employes/role/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des employés par rôle'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Créer un employé
  async function create(employe: IEmploye) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post(`${API_URL}/employes`, employe, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchAll() // Rafraîchir la liste
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de la création de l\'employé'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mettre à jour un employé
  async function update(email: string, updates: Partial<IEmploye>) {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.put(`${API_URL}/employes/${email}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchAll() // Rafraîchir la liste
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de l\'employé'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    employes,
    currentEmploye,
    loading,
    error,
    fetchAll,
    fetchByEmail,
    fetchByRole,
    create,
    update
  }
})
