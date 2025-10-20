<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFacturesStore } from '@/stores/factures'
import { usePatientsStore } from '@/stores/patients'
import { usePrestationsStore } from '@/stores/prestations'
import {
  Search,
  Plus,
  Edit,
  Delete,
  Document,
  Download,
  Promotion,
  Money,
  Warning,
  Check,
  Close,
  DocumentCopy
} from '@element-plus/icons-vue'
import type {
  IFactureDetailed,
  IFactureForm,
  ILigneFactureForm,
  StatutFacture,
  ModePaiement
} from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const facturesStore = useFacturesStore()
const patientsStore = usePatientsStore()
const prestationsStore = usePrestationsStore()

const loading = ref(false)
const searchQuery = ref('')
const activeTab = ref<StatutFacture | 'TOUTES'>('TOUTES')
const dialogVisible = ref(false)
const dialogTitle = ref('Créer une facture')
const isEditMode = ref(false)
const currentFactureId = ref<number | null>(null)
const detailsDialogVisible = ref(false)
const selectedFacture = ref<IFactureDetailed | null>(null)
const statutDialogVisible = ref(false)

const factureForm = ref<IFactureForm>({
  idPatient: 0,
  dateFacture: new Date().toISOString().split('T')[0],
  dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  montantHT: 0,
  montantTVA: 0,
  montantTTC: 0,
  montantPaye: 0,
  statutFacture: 'BROUILLON' as StatutFacture,
  modePaiement: undefined,
  datePaiement: undefined,
  notes: ''
})

const lignesFacture = ref<ILigneFactureForm[]>([])

const statutUpdateForm = ref({
  statutFacture: 'BROUILLON' as StatutFacture,
  montantPaye: 0,
  modePaiement: undefined as ModePaiement | undefined,
  datePaiement: ''
})

const formRules = {
  idPatient: [{ required: true, message: 'Le patient est requis', trigger: 'change' }],
  dateFacture: [{ required: true, message: 'La date est requise', trigger: 'change' }],
  dateEcheance: [{ required: true, message: "La date d'échéance est requise", trigger: 'change' }],
  statutFacture: [{ required: true, message: 'Le statut est requis', trigger: 'change' }]
}

const formRef = ref()

// Statut badges et couleurs
const getStatutType = (statut: StatutFacture) => {
  const types: Record<StatutFacture, 'info' | 'warning' | 'success' | 'danger'> = {
    BROUILLON: 'info',
    ENVOYEE: 'warning',
    PAYEE: 'success',
    PARTIELLE: 'warning',
    IMPAYEE: 'danger',
    ANNULEE: 'info'
  }
  return types[statut] || 'info'
}

const getStatutIcon = (statut: StatutFacture) => {
  const icons: Record<StatutFacture, any> = {
    BROUILLON: DocumentCopy,
    ENVOYEE: Promotion,
    PAYEE: Check,
    PARTIELLE: Warning,
    IMPAYEE: Warning,
    ANNULEE: Close
  }
  return icons[statut] || Document
}

// Filtered factures based on tab and search
const filteredFactures = computed(() => {
  let factures = facturesStore.factures

  // Filtrer par onglet
  if (activeTab.value !== 'TOUTES') {
    factures = factures.filter((f) => f.statutFacture === activeTab.value)
  }

  // Filtrer par recherche
  if (searchQuery.value) {
    factures = facturesStore.searchFactures(searchQuery.value)
    if (activeTab.value !== 'TOUTES') {
      factures = factures.filter((f) => f.statutFacture === activeTab.value)
    }
  }

  return factures
})

// Statistiques pour les onglets
const tabs = computed(() => [
  {
    label: 'Toutes',
    name: 'TOUTES' as const,
    count: facturesStore.factures.length
  },
  {
    label: 'Brouillons',
    name: 'BROUILLON' as StatutFacture,
    count: facturesStore.facturesByStatut('BROUILLON').length
  },
  {
    label: 'Envoyées',
    name: 'ENVOYEE' as StatutFacture,
    count: facturesStore.facturesByStatut('ENVOYEE').length
  },
  {
    label: 'Payées',
    name: 'PAYEE' as StatutFacture,
    count: facturesStore.facturesByStatut('PAYEE').length
  },
  {
    label: 'Impayées',
    name: 'IMPAYEE' as StatutFacture,
    count: facturesStore.facturesByStatut('IMPAYEE').length
  },
  {
    label: 'Partielles',
    name: 'PARTIELLE' as StatutFacture,
    count: facturesStore.facturesByStatut('PARTIELLE').length
  }
])

const openCreateDialog = () => {
  isEditMode.value = false
  dialogTitle.value = 'Créer une facture'
  resetForm()
  dialogVisible.value = true
}

const openDetailsDialog = async (facture: IFactureDetailed) => {
  selectedFacture.value = facture
  detailsDialogVisible.value = true
}

const openStatutDialog = (facture: IFactureDetailed) => {
  selectedFacture.value = facture
  statutUpdateForm.value = {
    statutFacture: facture.statutFacture,
    montantPaye: facture.montantPaye || 0,
    modePaiement: facture.modePaiement,
    datePaiement: facture.datePaiement ? format(new Date(facture.datePaiement), 'yyyy-MM-dd') : ''
  }
  statutDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      await facturesStore.create({
        facture: factureForm.value,
        lignes: lignesFacture.value
      })

      dialogVisible.value = false
      resetForm()
      ElMessage.success('Facture créée avec succès')
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Une erreur est survenue')
    } finally {
      loading.value = false
    }
  })
}

const handleStatutUpdate = async () => {
  if (!selectedFacture.value?.idFacture) return

  loading.value = true
  try {
    await facturesStore.updateStatut(selectedFacture.value.idFacture, statutUpdateForm.value)
    statutDialogVisible.value = false
    selectedFacture.value = null
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Erreur lors de la mise à jour')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (facture: IFactureDetailed) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer la facture ${facture.numeroFacture} ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        await facturesStore.delete(facture.idFacture!)
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {
      // User cancelled
    })
}

const ajouterLigne = () => {
  lignesFacture.value.push({
    idFacture: 0,
    idPrestation: 0,
    idRdv: undefined,
    description: '',
    quantite: 1,
    prixUnitaire: 0,
    montantHT: 0,
    tauxTVA: 0,
    montantTVA: 0,
    montantTTC: 0
  })
}

const retirerLigne = (index: number) => {
  lignesFacture.value.splice(index, 1)
  calculerMontants()
}

const calculerMontantsLigne = (ligne: ILigneFactureForm) => {
  ligne.montantHT = ligne.quantite * ligne.prixUnitaire
  ligne.montantTVA = (ligne.montantHT * ligne.tauxTVA) / 100
  ligne.montantTTC = ligne.montantHT + ligne.montantTVA
  calculerMontants()
}

const calculerMontants = () => {
  factureForm.value.montantHT = lignesFacture.value.reduce((sum, l) => sum + l.montantHT, 0)
  factureForm.value.montantTVA = lignesFacture.value.reduce((sum, l) => sum + l.montantTVA, 0)
  factureForm.value.montantTTC = lignesFacture.value.reduce((sum, l) => sum + l.montantTTC, 0)
}

const onPrestationSelect = (ligne: ILigneFactureForm) => {
  const prestation = prestationsStore.prestations.find((p) => p.idPrestation === ligne.idPrestation)
  if (prestation) {
    ligne.description = prestation.nomPrestation
    ligne.prixUnitaire = prestation.prix_TTC
    calculerMontantsLigne(ligne)
  }
}

const resetForm = () => {
  factureForm.value = {
    idPatient: 0,
    dateFacture: new Date().toISOString().split('T')[0],
    dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    montantHT: 0,
    montantTVA: 0,
    montantTTC: 0,
    montantPaye: 0,
    statutFacture: 'BROUILLON' as StatutFacture,
    modePaiement: undefined,
    datePaiement: undefined,
    notes: ''
  }
  lignesFacture.value = []
  formRef.value?.clearValidate()
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      facturesStore.fetchAll(),
      patientsStore.fetchAll(),
      prestationsStore.fetchAll()
    ])
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="facturation-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestion de la Facturation</h1>
        <p class="page-subtitle">{{ facturesStore.totalFactures }} facture(s) au total</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Créer une facture
      </el-button>
    </div>

    <!-- Statistiques rapides -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-success">
          <div class="stat-content">
            <el-icon class="stat-icon"><Money /></el-icon>
            <div>
              <div class="stat-value">{{ formatCurrency(facturesStore.totalPaye) }}</div>
              <div class="stat-label">Total payé</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-warning">
          <div class="stat-content">
            <el-icon class="stat-icon"><Warning /></el-icon>
            <div>
              <div class="stat-value">{{ formatCurrency(facturesStore.totalImpaye) }}</div>
              <div class="stat-label">Total impayé</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-danger">
          <div class="stat-content">
            <el-icon class="stat-icon"><Warning /></el-icon>
            <div>
              <div class="stat-value">{{ facturesStore.facturesEnRetard.length }}</div>
              <div class="stat-label">Factures en retard</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card stat-info">
          <div class="stat-content">
            <el-icon class="stat-icon"><Document /></el-icon>
            <div>
              <div class="stat-value">{{ facturesStore.totalFactures }}</div>
              <div class="stat-label">Total factures</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Search Bar -->
    <el-card shadow="never" class="search-card">
      <el-input
        v-model="searchQuery"
        placeholder="Rechercher par numéro de facture ou nom du patient..."
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </el-card>

    <!-- Tabs et Table -->
    <el-card shadow="never" v-loading="loading">
      <el-tabs v-model="activeTab" class="factures-tabs">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.name"
          :label="`${tab.label} (${tab.count})`"
          :name="tab.name"
        >
          <el-table :data="filteredFactures" style="width: 100%" stripe>
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-content">
                  <h4>Lignes de facturation</h4>
                  <el-table :data="row.lignes" size="small">
                    <el-table-column label="Description" prop="description" />
                    <el-table-column label="Quantité" prop="quantite" width="100" />
                    <el-table-column label="Prix unitaire" width="120">
                      <template #default="{ row: ligne }">
                        {{ formatCurrency(ligne.prixUnitaire) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="Montant HT" width="120">
                      <template #default="{ row: ligne }">
                        {{ formatCurrency(ligne.montantHT) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="TVA" width="100">
                      <template #default="{ row: ligne }">{{ ligne.tauxTVA }}%</template>
                    </el-table-column>
                    <el-table-column label="Montant TTC" width="120">
                      <template #default="{ row: ligne }">
                        {{ formatCurrency(ligne.montantTTC) }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="N° Facture" width="140" prop="numeroFacture" sortable />

            <el-table-column label="Patient" min-width="180" sortable>
              <template #default="{ row }">
                <div v-if="row.patient">
                  {{ row.patient.prenomPatient }} {{ row.patient.nomPatient }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Date" width="120" prop="dateFacture" sortable>
              <template #default="{ row }">{{ formatDate(row.dateFacture) }}</template>
            </el-table-column>

            <el-table-column label="Échéance" width="120" prop="dateEcheance" sortable>
              <template #default="{ row }">{{ formatDate(row.dateEcheance) }}</template>
            </el-table-column>

            <el-table-column label="Montant TTC" width="140" prop="montantTTC" sortable>
              <template #default="{ row }">{{ formatCurrency(row.montantTTC) }}</template>
            </el-table-column>

            <el-table-column label="Statut" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatutType(row.statutFacture)" :icon="getStatutIcon(row.statutFacture)">
                  {{ row.statutFacture }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="200" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    type="primary"
                    :icon="Document"
                    size="small"
                    link
                    @click="openDetailsDialog(row)"
                  >
                    Détails
                  </el-button>
                  <el-button
                    type="warning"
                    :icon="Edit"
                    size="small"
                    link
                    @click="openStatutDialog(row)"
                  >
                    Statut
                  </el-button>
                  <el-button
                    type="danger"
                    :icon="Delete"
                    size="small"
                    link
                    @click="handleDelete(row)"
                  >
                    Supprimer
                  </el-button>
                </div>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="Aucune facture trouvée" />
            </template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Dialog Créer Facture -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="factureForm"
        :rules="formRules"
        label-position="top"
        size="large"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Patient" prop="idPatient">
              <el-select
                v-model="factureForm.idPatient"
                placeholder="Sélectionner un patient"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="patient in patientsStore.patients"
                  :key="patient.idPatient"
                  :label="`${patient.prenomPatient} ${patient.nomPatient}`"
                  :value="patient.idPatient!"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="Date facture" prop="dateFacture">
              <el-date-picker
                v-model="factureForm.dateFacture"
                type="date"
                placeholder="Date"
                style="width: 100%"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="Échéance" prop="dateEcheance">
              <el-date-picker
                v-model="factureForm.dateEcheance"
                type="date"
                placeholder="Échéance"
                style="width: 100%"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>Lignes de facturation</el-divider>

        <div v-for="(ligne, index) in lignesFacture" :key="index" class="ligne-facture">
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item label="Prestation">
                <el-select
                  v-model="ligne.idPrestation"
                  placeholder="Sélectionner"
                  filterable
                  @change="onPrestationSelect(ligne)"
                  style="width: 100%"
                >
                  <el-option
                    v-for="prestation in prestationsStore.prestations"
                    :key="prestation.idPrestation"
                    :label="prestation.nomPrestation"
                    :value="prestation.idPrestation!"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="Description">
                <el-input v-model="ligne.description" placeholder="Description" />
              </el-form-item>
            </el-col>

            <el-col :span="3">
              <el-form-item label="Qté">
                <el-input-number
                  v-model="ligne.quantite"
                  :min="1"
                  @change="calculerMontantsLigne(ligne)"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :span="4">
              <el-form-item label="Prix HT">
                <el-input-number
                  v-model="ligne.prixUnitaire"
                  :min="0"
                  :precision="2"
                  @change="calculerMontantsLigne(ligne)"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :span="1">
              <el-form-item label=" ">
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="retirerLigne(index)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-button type="primary" :icon="Plus" @click="ajouterLigne" plain>
          Ajouter une ligne
        </el-button>

        <el-divider />

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Notes">
              <el-input
                v-model="factureForm.notes"
                type="textarea"
                :rows="3"
                placeholder="Notes additionnelles..."
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <div class="montants-recapitulatifs">
              <div class="montant-line">
                <span>Montant HT:</span>
                <strong>{{ formatCurrency(factureForm.montantHT) }}</strong>
              </div>
              <div class="montant-line">
                <span>TVA:</span>
                <strong>{{ formatCurrency(factureForm.montantTVA) }}</strong>
              </div>
              <el-divider style="margin: 8px 0" />
              <div class="montant-line total">
                <span>Total TTC:</span>
                <strong>{{ formatCurrency(factureForm.montantTTC) }}</strong>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Annuler</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          Créer la facture
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialog Détails Facture -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="Détails de la facture"
      width="800px"
    >
      <div v-if="selectedFacture" class="facture-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="N° Facture">
            {{ selectedFacture.numeroFacture }}
          </el-descriptions-item>
          <el-descriptions-item label="Statut">
            <el-tag :type="getStatutType(selectedFacture.statutFacture)">
              {{ selectedFacture.statutFacture }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Patient">
            {{ selectedFacture.patient?.prenomPatient }} {{ selectedFacture.patient?.nomPatient }}
          </el-descriptions-item>
          <el-descriptions-item label="Contact">
            {{ selectedFacture.patient?.numPatient }}
          </el-descriptions-item>
          <el-descriptions-item label="Date facture">
            {{ formatDate(selectedFacture.dateFacture) }}
          </el-descriptions-item>
          <el-descriptions-item label="Date échéance">
            {{ formatDate(selectedFacture.dateEcheance) }}
          </el-descriptions-item>
          <el-descriptions-item label="Montant TTC" :span="2">
            <strong style="font-size: 18px">{{ formatCurrency(selectedFacture.montantTTC) }}</strong>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedFacture.notes" label="Notes" :span="2">
            {{ selectedFacture.notes }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>Lignes de facturation</el-divider>

        <el-table :data="selectedFacture.lignes" stripe>
          <el-table-column label="Description" prop="description" />
          <el-table-column label="Quantité" prop="quantite" width="100" />
          <el-table-column label="Prix unitaire" width="120">
            <template #default="{ row }">{{ formatCurrency(row.prixUnitaire) }}</template>
          </el-table-column>
          <el-table-column label="Montant TTC" width="120">
            <template #default="{ row }">{{ formatCurrency(row.montantTTC) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- Dialog Mise à jour Statut -->
    <el-dialog
      v-model="statutDialogVisible"
      title="Mettre à jour le statut"
      width="500px"
    >
      <el-form label-position="top">
        <el-form-item label="Statut">
          <el-select v-model="statutUpdateForm.statutFacture" style="width: 100%">
            <el-option label="Brouillon" value="BROUILLON" />
            <el-option label="Envoyée" value="ENVOYEE" />
            <el-option label="Payée" value="PAYEE" />
            <el-option label="Paiement partiel" value="PARTIELLE" />
            <el-option label="Impayée" value="IMPAYEE" />
            <el-option label="Annulée" value="ANNULEE" />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="statutUpdateForm.statutFacture === 'PAYEE' || statutUpdateForm.statutFacture === 'PARTIELLE'"
          label="Montant payé"
        >
          <el-input-number
            v-model="statutUpdateForm.montantPaye"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item
          v-if="statutUpdateForm.statutFacture === 'PAYEE' || statutUpdateForm.statutFacture === 'PARTIELLE'"
          label="Mode de paiement"
        >
          <el-select v-model="statutUpdateForm.modePaiement" style="width: 100%">
            <el-option label="Espèces" value="ESPECES" />
            <el-option label="Carte bancaire" value="CARTE" />
            <el-option label="Chèque" value="CHEQUE" />
            <el-option label="Virement" value="VIREMENT" />
            <el-option label="Mutuelle" value="MUTUELLE" />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="statutUpdateForm.statutFacture === 'PAYEE' || statutUpdateForm.statutFacture === 'PARTIELLE'"
          label="Date de paiement"
        >
          <el-date-picker
            v-model="statutUpdateForm.datePaiement"
            type="date"
            placeholder="Date"
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="statutDialogVisible = false">Annuler</el-button>
        <el-button type="primary" :loading="loading" @click="handleStatutUpdate">
          Mettre à jour
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.facturation-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 40px;
  padding: 12px;
  border-radius: 12px;
}

.stat-success .stat-icon {
  background: #d1fae5;
  color: #059669;
}

.stat-warning .stat-icon {
  background: #fef3c7;
  color: #d97706;
}

.stat-danger .stat-icon {
  background: #fee2e2;
  color: #dc2626;
}

.stat-info .stat-icon {
  background: #dbeafe;
  color: #2563eb;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.search-card {
  margin-bottom: 20px;
  border: none;
}

.factures-tabs {
  margin-top: -16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.expand-content {
  padding: 16px;
  background: #f9fafb;
}

.expand-content h4 {
  margin: 0 0 12px 0;
  color: #374151;
}

.ligne-facture {
  margin-bottom: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.montants-recapitulatifs {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.montant-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.montant-line.total {
  font-size: 18px;
  color: #059669;
}

.facture-details {
  padding: 8px 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-row {
    margin-bottom: 16px;
  }
}
</style>
