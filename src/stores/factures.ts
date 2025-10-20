import { defineStore } from 'pinia'
import api, { handleApiError } from '@/services/api'
import type {
  IFacture,
  IFactureDetailed,
  IFactureForm,
  ILigneFacture,
  ILigneFactureForm,
  StatutFacture,
  ModePaiement
} from '@/types'
import { ElMessage } from 'element-plus'

interface FacturesState {
  factures: IFactureDetailed[]
  currentFacture: IFactureDetailed | null
  loading: boolean
  error: string | null
}

export const useFacturesStore = defineStore('factures', {
  state: (): FacturesState => ({
    factures: [],
    currentFacture: null,
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Obtenir le nombre total de factures
     */
    totalFactures: (state): number => state.factures.length,

    /**
     * Obtenir les factures par statut
     */
    facturesByStatut: (state) => (statut: StatutFacture): IFactureDetailed[] => {
      return state.factures.filter((f) => f.statutFacture === statut)
    },

    /**
     * Obtenir les factures d'un patient
     */
    facturesByPatient: (state) => (idPatient: number): IFactureDetailed[] => {
      return state.factures.filter((f) => f.idPatient === idPatient)
    },

    /**
     * Calculer le total des factures payées
     */
    totalPaye: (state): number => {
      return state.factures
        .filter((f) => f.statutFacture === 'PAYEE')
        .reduce((sum, f) => sum + f.montantTTC, 0)
    },

    /**
     * Calculer le total des factures impayées
     */
    totalImpaye: (state): number => {
      return state.factures
        .filter((f) => f.statutFacture === 'IMPAYEE' || f.statutFacture === 'ENVOYEE')
        .reduce((sum, f) => sum + f.montantTTC, 0)
    },

    /**
     * Obtenir les factures en retard (échéance dépassée)
     */
    facturesEnRetard: (state): IFactureDetailed[] => {
      const today = new Date()
      return state.factures.filter((f) => {
        const echeance = new Date(f.dateEcheance)
        return (
          (f.statutFacture === 'IMPAYEE' || f.statutFacture === 'ENVOYEE') &&
          echeance < today
        )
      })
    },

    /**
     * Rechercher des factures par numéro ou nom patient
     */
    searchFactures: (state) => (searchTerm: string): IFactureDetailed[] => {
      if (!searchTerm) return state.factures

      const term = searchTerm.toLowerCase()
      return state.factures.filter(
        (f) =>
          f.numeroFacture.toLowerCase().includes(term) ||
          f.patient?.nomPatient.toLowerCase().includes(term) ||
          f.patient?.prenomPatient.toLowerCase().includes(term)
      )
    },
  },

  actions: {
    /**
     * Récupérer toutes les factures
     */
    async fetchAll() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IFactureDetailed[]>('/factures')
        this.factures = response.data
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Récupérer une facture par ID
     */
    async fetchOne(id: number) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IFactureDetailed>(`/factures/${id}`)
        this.currentFacture = response.data
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
     * Récupérer les factures par statut
     */
    async fetchByStatut(statut: StatutFacture) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IFactureDetailed[]>(`/factures/statut/${statut}`)
        // Mettre à jour seulement les factures de ce statut dans le state
        const autresFactures = this.factures.filter((f) => f.statutFacture !== statut)
        this.factures = [...autresFactures, ...response.data]
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
     * Récupérer les factures d'un patient
     */
    async fetchByPatient(idPatient: number) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get<IFactureDetailed[]>(`/factures/patient/${idPatient}`)
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
     * Créer une nouvelle facture
     */
    async create(data: { facture: IFactureForm; lignes?: ILigneFactureForm[] }) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post<{ message: string; facture: IFactureDetailed }>(
          '/factures',
          data
        )
        this.factures.unshift(response.data.facture)
        ElMessage.success('Facture créée avec succès')
        return response.data.facture
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Ajouter une ligne à une facture
     */
    async ajouterLigne(idFacture: number, ligne: Omit<ILigneFactureForm, 'idFacture'>) {
      this.loading = true
      this.error = null

      try {
        const response = await api.post<{ message: string; idLigne: number }>(
          `/factures/${idFacture}/lignes`,
          ligne
        )
        ElMessage.success('Ligne ajoutée avec succès')
        // Recharger la facture pour avoir les données à jour
        await this.fetchOne(idFacture)
        return response.data.idLigne
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Mettre à jour le statut d'une facture
     */
    async updateStatut(
      idFacture: number,
      data: {
        statutFacture: StatutFacture
        montantPaye?: number
        modePaiement?: ModePaiement
        datePaiement?: Date | string
      }
    ) {
      this.loading = true
      this.error = null

      try {
        await api.put(`/factures/${idFacture}/statut`, data)

        // Mettre à jour dans le state local
        const index = this.factures.findIndex((f) => f.idFacture === idFacture)
        if (index !== -1) {
          this.factures[index] = {
            ...this.factures[index],
            ...data,
            updatedAt: new Date().toISOString(),
          }
        }

        // Mettre à jour currentFacture si c'est celle-ci
        if (this.currentFacture && this.currentFacture.idFacture === idFacture) {
          this.currentFacture = {
            ...this.currentFacture,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        }

        ElMessage.success('Statut mis à jour avec succès')
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Supprimer une facture
     */
    async delete(idFacture: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(`/factures/${idFacture}`)
        this.factures = this.factures.filter((f) => f.idFacture !== idFacture)

        if (this.currentFacture?.idFacture === idFacture) {
          this.currentFacture = null
        }

        ElMessage.success('Facture supprimée avec succès')
      } catch (error) {
        this.error = handleApiError(error)
        ElMessage.error(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Réinitialiser l'état
     */
    reset() {
      this.factures = []
      this.currentFacture = null
      this.loading = false
      this.error = null
    },
  },
})
