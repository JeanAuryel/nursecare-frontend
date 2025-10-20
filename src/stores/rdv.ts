import { defineStore } from 'pinia'
import api, { handleApiError } from '@/services/api'
import type { IRdv, IRdvForm, IRdvDetailed } from '@/types'
import { ElMessage } from 'element-plus'
import { format, parseISO } from 'date-fns'

interface RdvState {
  rdvs: IRdvDetailed[]
  currentRdv: IRdvDetailed | null
  loading: boolean
  error: string | null
}

export const useRdvStore = defineStore('rdv', {
  state: (): RdvState => ({
    rdvs: [],
    currentRdv: null,
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Obtenir les RDV du jour
     */
    rdvDuJour: (state): IRdvDetailed[] => {
      const today = format(new Date(), 'yyyy-MM-dd')
      return state.rdvs.filter((rdv) => {
        const rdvDate = format(parseISO(rdv.timestamp_RDV_prevu as string), 'yyyy-MM-dd')
        return rdvDate === today
      })
    },

    /**
     * Obtenir les RDV d'un employé
     */
    rdvByEmploye: (state) => (idEmploye: number): IRdvDetailed[] => {
      return state.rdvs.filter((rdv) => rdv.idEmploye === idEmploye)
    },

    /**
     * Obtenir les RDV d'un patient
     */
    rdvByPatient: (state) => (idPatient: number): IRdvDetailed[] => {
      return state.rdvs.filter((rdv) => rdv.idPatient === idPatient)
    },

    /**
     * Obtenir les RDV non réalisés
     */
    rdvNonRealises: (state): IRdvDetailed[] => {
      return state.rdvs.filter((rdv) => !rdv.timestamp_RDV_reel)
    },

    /**
     * Obtenir les RDV pour FullCalendar
     */
    calendarEvents: (state): any[] => {
      return state.rdvs.map((rdv) => ({
        id: `${rdv.idEmploye}-${rdv.idPrestation}-${rdv.idPatient}-${rdv.idStagiaire}`,
        title: `${rdv.patient?.prenomPatient} ${rdv.patient?.nomPatient} - ${rdv.prestation?.nomPrestation}`,
        start: rdv.timestamp_RDV_prevu,
        end: rdv.timestamp_RDV_reel || rdv.timestamp_RDV_prevu,
        backgroundColor: rdv.timestamp_RDV_reel ? '#67C23A' : '#409EFF',
        extendedProps: {
          employe: rdv.employe,
          patient: rdv.patient,
          prestation: rdv.prestation,
          stagiaire: rdv.stagiaire,
          noteStagiaire: rdv.noteStagiaire,
          commentaireStagiaire: rdv.commentaireStagiaire,
          completed: !!rdv.timestamp_RDV_reel,
        },
      }))
    },
  },

  actions: {
    /**
     * Récupérer tous les RDV
     */
    async fetchAll() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IRdvDetailed[]>('/rdv')
        this.rdvs = response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Récupérer un RDV spécifique
     */
    async fetchOne(idEmploye: number, idPrestation: number, idPatient: number, idStagiaire: number) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IRdvDetailed>(
          `/rdv/${idEmploye}/${idPrestation}/${idPatient}/${idStagiaire}`
        )
        this.currentRdv = response.data
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
     * Créer un nouveau RDV
     */
    async create(rdv: IRdvForm) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post<IRdvDetailed>('/rdv', rdv)
        this.rdvs.push(response.data)
        ElMessage.success('Rendez-vous créé avec succès')
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
     * Mettre à jour un RDV
     */
    async update(rdv: IRdvForm) {
      this.loading = true
      this.error = null

      try {
        const response = await api.put<IRdvDetailed>('/rdv', rdv)
        const index = this.rdvs.findIndex(
          (r) =>
            r.idEmploye === rdv.idEmploye &&
            r.idPrestation === rdv.idPrestation &&
            r.idPatient === rdv.idPatient &&
            r.idStagiaire === rdv.idStagiaire
        )
        if (index !== -1) {
          this.rdvs[index] = response.data
        }
        ElMessage.success('Rendez-vous mis à jour avec succès')
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
     * Supprimer un RDV
     */
    async delete(idEmploye: number, idPrestation: number, idPatient: number, idStagiaire: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(`/rdv/${idEmploye}/${idPrestation}/${idPatient}/${idStagiaire}`)
        this.rdvs = this.rdvs.filter(
          (r) =>
            !(
              r.idEmploye === idEmploye &&
              r.idPrestation === idPrestation &&
              r.idPatient === idPatient &&
              r.idStagiaire === idStagiaire
            )
        )
        ElMessage.success('Rendez-vous supprimé avec succès')
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Marquer un RDV comme réalisé
     */
    async marquerRealise(
      idEmploye: number,
      idPrestation: number,
      idPatient: number,
      idStagiaire: number,
      noteStagiaire?: number,
      commentaireStagiaire?: string
    ) {
      const rdv: IRdvForm = {
        idEmploye,
        idPrestation,
        idPatient,
        idStagiaire,
        timestamp_RDV_prevu: new Date().toISOString(),
        timestamp_RDV_reel: new Date().toISOString(),
        noteStagiaire,
        commentaireStagiaire,
      }
      return this.update(rdv)
    },
  },
})
