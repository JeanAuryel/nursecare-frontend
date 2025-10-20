import { defineStore } from 'pinia'
import api, { handleApiError } from '@/services/api'
import type { IRdvDetailed } from '@/types'
import { ElMessage } from 'element-plus'

interface RdvRealisesState {
  prestations: IRdvDetailed[]
  currentPrestation: IRdvDetailed | null
  loading: boolean
  error: string | null
}

export const useRdvRealisesStore = defineStore('rdvRealises', {
  state: (): RdvRealisesState => ({
    prestations: [],
    currentPrestation: null,
    loading: false,
    error: null,
  }),

  getters: {
    totalPrestations: (state): number => state.prestations.length,

    prestationsAFacturer: (state): IRdvDetailed[] => {
      return state.prestations.filter(
        (p) => p.timestamp_RDV_reel && !p.timestamp_RDV_facture
      )
    },

    prestationsFacturees: (state): IRdvDetailed[] => {
      return state.prestations.filter((p) => p.timestamp_RDV_facture)
    },

    prestationsIntegreesPGI: (state): IRdvDetailed[] => {
      return state.prestations.filter((p) => p.timestamp_RDV_integrePGI)
    },

    montantTotalAFacturer: (state): number => {
      return state.prestations
        .filter((p) => p.timestamp_RDV_reel && !p.timestamp_RDV_facture)
        .reduce((sum, p) => sum + (p.prestation?.prix_TTC || 0), 0)
    },

    montantTotalFacture: (state): number => {
      return state.prestations
        .filter((p) => p.timestamp_RDV_facture)
        .reduce((sum, p) => sum + (p.prestation?.prix_TTC || 0), 0)
    },

    searchPrestations: (state) => (searchTerm: string): IRdvDetailed[] => {
      if (!searchTerm) return state.prestations

      const term = searchTerm.toLowerCase()
      return state.prestations.filter(
        (p) =>
          p.patient?.nomPatient.toLowerCase().includes(term) ||
          p.patient?.prenomPatient.toLowerCase().includes(term) ||
          p.employe?.nomEmploye.toLowerCase().includes(term) ||
          p.employe?.prenomEmploye.toLowerCase().includes(term) ||
          p.prestation?.nomPrestation.toLowerCase().includes(term)
      )
    },
  },

  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IRdvDetailed[]>('/rdv/prestations/realisees')
        this.prestations = response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAFacturer() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IRdvDetailed[]>('/rdv/prestations/a-facturer')
        this.prestations = response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchFacturees() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IRdvDetailed[]>('/rdv/prestations/facturees')
        this.prestations = response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchOne(idRdv: number) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IRdvDetailed>(`/rdv/prestations/${idRdv}`)
        this.currentPrestation = response.data
        return response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async marquerFacturee(idRdv: number) {
      this.loading = true
      this.error = null

      try {
        await api.put(`/rdv/prestations/${idRdv}/facturer`)

        const index = this.prestations.findIndex((p) => p.idRdv === idRdv)
        if (index !== -1) {
          this.prestations[index].timestamp_RDV_facture = new Date().toISOString()
        }

        ElMessage.success('Prestation marquée comme facturée')
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async marquerIntegrePGI(idRdv: number) {
      this.loading = true
      this.error = null

      try {
        await api.put(`/rdv/prestations/${idRdv}/integrer-pgi`)

        const index = this.prestations.findIndex((p) => p.idRdv === idRdv)
        if (index !== -1) {
          this.prestations[index].timestamp_RDV_integrePGI = new Date().toISOString()
        }

        ElMessage.success('Prestation marquée comme intégrée au PGI')
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async marquerPlusieursFacturees(idRdvs: number[]) {
      this.loading = true
      this.error = null

      try {
        await Promise.all(idRdvs.map((id) => api.put(`/rdv/prestations/${id}/facturer`)))

        idRdvs.forEach((idRdv) => {
          const index = this.prestations.findIndex((p) => p.idRdv === idRdv)
          if (index !== -1) {
            this.prestations[index].timestamp_RDV_facture = new Date().toISOString()
          }
        })

        ElMessage.success(`${idRdvs.length} prestation(s) marquée(s) comme facturée(s)`)
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    reset() {
      this.prestations = []
      this.currentPrestation = null
      this.loading = false
      this.error = null
    },
  },
})
