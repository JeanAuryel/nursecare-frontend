import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export const useSecretariatStore = defineStore('secretariat', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Helper pour les requêtes GET
  const makeRequest = async (endpoint: string, params?: Record<string, any>) => {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${API_URL}/secretariat/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des données'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Helper pour les requêtes POST
  const makePostRequest = async (endpoint: string, data: any) => {
    loading.value = true
    error.value = null
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post(`${API_URL}/secretariat/${endpoint}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== DASHBOARD ====================
  async function getDashboard() {
    return makeRequest('dashboard')
  }

  // ==================== AGENDA ====================
  async function getRDVDuJour(date?: string) {
    return makeRequest('agenda/jour', date ? { date } : undefined)
  }

  async function getRDVDeLaSemaine(date?: string) {
    return makeRequest('agenda/semaine', date ? { date } : undefined)
  }

  async function getRDVEmployeDuJour(idEmploye: number, date?: string) {
    return makeRequest(`agenda/employe/${idEmploye}`, date ? { date } : undefined)
  }

  async function getDisponibilites(date: string, idEmploye?: number) {
    const params: any = { date }
    if (idEmploye) params.idEmploye = idEmploye
    return makeRequest('agenda/disponibilites', params)
  }

  // ==================== RAPPELS ====================
  async function getRDVARappeler() {
    return makeRequest('rappels/demain')
  }

  // ==================== PAIEMENTS ====================
  async function enregistrerPaiement(idFacture: number, paiement: {
    montantPaye: number
    modePaiement: string
    datePaiement?: string
  }) {
    return makePostRequest(`paiement/${idFacture}`, paiement)
  }

  async function getFacturesEnAttente() {
    return makeRequest('factures/en-attente')
  }

  async function getFacturesEnRetard() {
    return makeRequest('factures/en-retard')
  }

  // ==================== HISTORIQUE PATIENT ====================
  async function getHistoriquePatient(idPatient: number) {
    return makeRequest(`patient/${idPatient}/historique`)
  }

  async function getFacturesImpayeesPatient(idPatient: number) {
    return makeRequest(`patient/${idPatient}/factures-impayees`)
  }

  return {
    loading,
    error,
    // Dashboard
    getDashboard,
    // Agenda
    getRDVDuJour,
    getRDVDeLaSemaine,
    getRDVEmployeDuJour,
    getDisponibilites,
    // Rappels
    getRDVARappeler,
    // Paiements
    enregistrerPaiement,
    getFacturesEnAttente,
    getFacturesEnRetard,
    // Historique patient
    getHistoriquePatient,
    getFacturesImpayeesPatient
  }
})
