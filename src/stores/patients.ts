import { defineStore } from 'pinia'
import api, { handleApiError } from '@/services/api'
import type { IPatient, IPatientForm } from '@/types'
import { ElMessage } from 'element-plus'

interface PatientsState {
  patients: IPatient[]
  currentPatient: IPatient | null
  loading: boolean
  error: string | null
}

export const usePatientsStore = defineStore('patients', {
  state: (): PatientsState => ({
    patients: [],
    currentPatient: null,
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Obtenir le nombre total de patients
     */
    totalPatients: (state): number => state.patients.length,

    /**
     * Rechercher des patients par nom/prénom
     */
    searchPatients: (state) => (searchTerm: string): IPatient[] => {
      if (!searchTerm) return state.patients

      const term = searchTerm.toLowerCase()
      return state.patients.filter(
        (p) =>
          p.nomPatient.toLowerCase().includes(term) ||
          p.prenomPatient.toLowerCase().includes(term) ||
          p.mailPatient.toLowerCase().includes(term)
      )
    },
  },

  actions: {
    /**
     * Récupérer tous les patients
     */
    async fetchAll() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IPatient[]>('/patients')
        this.patients = response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Récupérer un patient par ID
     */
    async fetchOne(id: number) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IPatient>(`/patients/${id}`)
        this.currentPatient = response.data
        return response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Créer un nouveau patient
     */
    async create(patient: IPatientForm) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post<IPatient>('/patients', patient)
        this.patients.push(response.data)
        ElMessage.success('Patient créé avec succès')
        return response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Mettre à jour un patient
     */
    async update(id: number, patient: Partial<IPatientForm>) {
      this.loading = true
      this.error = null

      try {
        const response = await api.put<IPatient>(`/patients/${id}`, patient)
        const index = this.patients.findIndex((p) => p.idPatient === id)
        if (index !== -1) {
          this.patients[index] = response.data
        }
        ElMessage.success('Patient mis à jour avec succès')
        return response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Supprimer un patient
     */
    async delete(id: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(`/patients/${id}`)
        this.patients = this.patients.filter((p) => p.idPatient !== id)
        ElMessage.success('Patient supprimé avec succès')
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
