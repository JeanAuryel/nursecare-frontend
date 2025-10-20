import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useStatsStore = defineStore('stats', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Helper pour les requêtes
  const makeRequest = async (endpoint: string, params?: Record<string, any>) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/stats/${endpoint}`, { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des statistiques'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ==================== DASHBOARD ====================
  async function getDashboard() {
    return makeRequest('dashboard')
  }

  // ==================== STATISTIQUES FINANCIÈRES ====================
  async function getFinancierGlobal() {
    return makeRequest('financier/global')
  }

  async function getCAMensuel(annee?: number) {
    return makeRequest('financier/mensuel', { annee })
  }

  async function getCAParEmploye() {
    return makeRequest('financier/par-employe')
  }

  // ==================== STATISTIQUES RDV ====================
  async function getRDVGlobal() {
    return makeRequest('rdv/global')
  }

  async function getRDVParJour(debut: string, fin: string) {
    return makeRequest('rdv/par-jour', { debut, fin })
  }

  async function getRDVParMois(annee?: number) {
    return makeRequest('rdv/par-mois', { annee })
  }

  async function getRDVParEmploye(debut?: string, fin?: string) {
    return makeRequest('rdv/par-employe', debut && fin ? { debut, fin } : undefined)
  }

  async function getRDVEmployeParJour(idEmploye: number, debut: string, fin: string) {
    return makeRequest(`rdv/employe/${idEmploye}/par-jour`, { debut, fin })
  }

  // ==================== STATISTIQUES PATIENTS ====================
  async function getPatientsGlobal() {
    return makeRequest('patients/global')
  }

  async function getNouveauxPatientsParMois(annee?: number) {
    return makeRequest('patients/nouveaux', { annee })
  }

  async function getTopPatients(limit: number = 10) {
    return makeRequest('patients/top', { limit })
  }

  // ==================== STATISTIQUES PRESTATIONS ====================
  async function getPrestationsPopulaires(limit: number = 10) {
    return makeRequest('prestations/populaires', { limit })
  }

  // ==================== STATISTIQUES EMPLOYÉS ====================
  async function getPerformanceEmployes() {
    return makeRequest('employes/performance')
  }

  async function getStatsEmployeDetaille(idEmploye: number) {
    return makeRequest(`employes/${idEmploye}/detaille`)
  }

  return {
    loading,
    error,
    // Dashboard
    getDashboard,
    // Financier
    getFinancierGlobal,
    getCAMensuel,
    getCAParEmploye,
    // RDV
    getRDVGlobal,
    getRDVParJour,
    getRDVParMois,
    getRDVParEmploye,
    getRDVEmployeParJour,
    // Patients
    getPatientsGlobal,
    getNouveauxPatientsParMois,
    getTopPatients,
    // Prestations
    getPrestationsPopulaires,
    // Employés
    getPerformanceEmployes,
    getStatsEmployeDetaille
  }
})
