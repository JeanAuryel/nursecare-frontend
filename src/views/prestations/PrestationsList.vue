<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePrestationsStore, useCategoriesStore, useRdvRealisesStore } from '@/stores'
import { Search, Plus, Edit, Delete, Document, Grid, Money, Clock, Check, DocumentChecked, Upload } from '@element-plus/icons-vue'
import type { IPrestation, IPrestationForm, ICategorie, ICategorieForm, IRdvDetailed } from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const prestationsStore = usePrestationsStore()
const categoriesStore = useCategoriesStore()
const rdvRealisesStore = useRdvRealisesStore()

const loading = ref(false)
const activeTab = ref('prestations')
const searchQuery = ref('')

// Prestations refs
const dialogVisible = ref(false)
const dialogTitle = ref('Ajouter une prestation')
const isEditMode = ref(false)
const currentPrestationId = ref<number | null>(null)
const prestationForm = ref<IPrestationForm>({
  nomPrestation: '',
  prix_TTC: 0,
  idCategorie: 0,
})

// Categories refs
const categorieDialogVisible = ref(false)
const categorieDialogTitle = ref('Ajouter une catégorie')
const isCategorieEditMode = ref(false)
const currentCategorieId = ref<number | null>(null)
const categorieForm = ref<ICategorieForm>({
  nomCategorie: '',
})

// RDV réalisés refs
const rdvRealisesTab = ref<'toutes' | 'a-facturer' | 'facturees'>('a-facturer')
const selectedPrestations = ref<number[]>([])

const prestationFormRules = {
  nomPrestation: [
    { required: true, message: 'Le nom de la prestation est requis', trigger: 'blur' },
    { min: 3, message: 'Le nom doit contenir au moins 3 caractères', trigger: 'blur' },
  ],
  prix_TTC: [
    { required: true, message: 'Le prix TTC est requis', trigger: 'blur', type: 'number' },
    { type: 'number', min: 0.01, message: 'Le prix doit être supérieur à 0', trigger: 'blur' },
  ],
  idCategorie: [
    { required: true, message: 'La catégorie est requise', trigger: 'change', type: 'number' },
  ],
}

const categorieFormRules = {
  nomCategorie: [
    { required: true, message: 'Le nom de la catégorie est requis', trigger: 'blur' },
    { min: 2, message: 'Le nom doit contenir au moins 2 caractères', trigger: 'blur' },
  ],
}

const prestationFormRef = ref()
const categorieFormRef = ref()

// ===== PRESTATIONS COMPUTED =====
const filteredPrestations = computed(() => {
  if (!searchQuery.value) {
    return prestationsStore.prestations
  }
  return prestationsStore.searchPrestations(searchQuery.value)
})

// ===== CATEGORIES COMPUTED =====
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return categoriesStore.categories
  }
  return categoriesStore.searchCategories(searchQuery.value)
})

// ===== RDV RÉALISÉS COMPUTED =====
const filteredRdvRealises = computed(() => {
  let prestations = rdvRealisesStore.prestations

  if (rdvRealisesTab.value === 'a-facturer') {
    prestations = rdvRealisesStore.prestationsAFacturer
  } else if (rdvRealisesTab.value === 'facturees') {
    prestations = rdvRealisesStore.prestationsFacturees
  }

  if (searchQuery.value) {
    prestations = rdvRealisesStore.searchPrestations(searchQuery.value)
      .filter((p) => {
        if (rdvRealisesTab.value === 'a-facturer') return p.timestamp_RDV_reel && !p.timestamp_RDV_facture
        if (rdvRealisesTab.value === 'facturees') return p.timestamp_RDV_facture
        return true
      })
  }

  return prestations
})

const rdvRealisesTabs = computed(() => [
  { label: 'Toutes', name: 'toutes' as const, count: rdvRealisesStore.totalPrestations },
  { label: 'À facturer', name: 'a-facturer' as const, count: rdvRealisesStore.prestationsAFacturer.length },
  { label: 'Facturées', name: 'facturees' as const, count: rdvRealisesStore.prestationsFacturees.length }
])

// ===== PRESTATIONS METHODS =====
const openCreateDialog = () => {
  isEditMode.value = false
  dialogTitle.value = 'Ajouter une prestation'
  resetPrestationForm()
  dialogVisible.value = true
}

const openEditDialog = (prestation: IPrestation) => {
  isEditMode.value = true
  dialogTitle.value = 'Modifier la prestation'
  currentPrestationId.value = prestation.idPrestation!

  prestationForm.value = {
    nomPrestation: prestation.nomPrestation,
    prix_TTC: prestation.prix_TTC,
    idCategorie: prestation.idCategorie,
  }

  dialogVisible.value = true
}

const handlePrestationSubmit = async () => {
  if (!prestationFormRef.value) return

  await prestationFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      if (isEditMode.value && currentPrestationId.value) {
        await prestationsStore.update(currentPrestationId.value, prestationForm.value)
        ElMessage.success('Prestation modifiée avec succès')
      } else {
        await prestationsStore.create(prestationForm.value)
        ElMessage.success('Prestation créée avec succès')
      }

      dialogVisible.value = false
      resetPrestationForm()
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Une erreur est survenue')
    } finally {
      loading.value = false
    }
  })
}

const handlePrestationDelete = async (prestation: IPrestation) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer la prestation "${prestation.nomPrestation}" ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await prestationsStore.delete(prestation.idPrestation!)
        ElMessage.success('Prestation supprimée avec succès')
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {})
}

const resetPrestationForm = () => {
  prestationForm.value = {
    nomPrestation: '',
    prix_TTC: 0,
    idCategorie: 0,
  }
  currentPrestationId.value = null
  prestationFormRef.value?.clearValidate()
}

// ===== CATEGORIES METHODS =====
const openCreateCategorieDialog = () => {
  isCategorieEditMode.value = false
  categorieDialogTitle.value = 'Ajouter une catégorie'
  resetCategorieForm()
  categorieDialogVisible.value = true
}

const openEditCategorieDialog = (categorie: ICategorie) => {
  isCategorieEditMode.value = true
  categorieDialogTitle.value = 'Modifier la catégorie'
  currentCategorieId.value = categorie.idCategorie!

  categorieForm.value = {
    nomCategorie: categorie.nomCategorie,
  }

  categorieDialogVisible.value = true
}

const handleCategorieSubmit = async () => {
  if (!categorieFormRef.value) return

  await categorieFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      if (isCategorieEditMode.value && currentCategorieId.value) {
        await categoriesStore.update(currentCategorieId.value, categorieForm.value)
        ElMessage.success('Catégorie modifiée avec succès')
      } else {
        await categoriesStore.create(categorieForm.value)
        ElMessage.success('Catégorie créée avec succès')
      }

      categorieDialogVisible.value = false
      resetCategorieForm()
      await prestationsStore.fetchAll() // Refresh prestations to get updated categories
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || 'Une erreur est survenue')
    } finally {
      loading.value = false
    }
  })
}

const handleCategorieDelete = async (categorie: ICategorie) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer la catégorie "${categorie.nomCategorie}" ?`,
    'Confirmation de suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await categoriesStore.delete(categorie.idCategorie!)
        ElMessage.success('Catégorie supprimée avec succès')
        await prestationsStore.fetchAll() // Refresh prestations
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    })
    .catch(() => {})
}

const resetCategorieForm = () => {
  categorieForm.value = {
    nomCategorie: '',
  }
  currentCategorieId.value = null
  categorieFormRef.value?.clearValidate()
}

// ===== RDV RÉALISÉS METHODS =====
const handleMarquerFacturee = async (prestation: IRdvDetailed) => {
  if (!prestation.idRdv) return

  ElMessageBox.confirm('Marquer cette prestation comme facturée ?', 'Confirmation', {
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler',
    type: 'info'
  })
    .then(async () => {
      try {
        await rdvRealisesStore.marquerFacturee(prestation.idRdv!)
        await loadRdvRealises()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur')
      }
    })
    .catch(() => {})
}

const handleMarquerPlusieurs = async () => {
  if (selectedPrestations.value.length === 0) {
    ElMessage.warning('Veuillez sélectionner au moins une prestation')
    return
  }

  ElMessageBox.confirm(
    `Marquer ${selectedPrestations.value.length} prestation(s) comme facturée(s) ?`,
    'Confirmation',
    {
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      type: 'info'
    }
  )
    .then(async () => {
      try {
        await rdvRealisesStore.marquerPlusieursFacturees(selectedPrestations.value)
        selectedPrestations.value = []
        await loadRdvRealises()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur')
      }
    })
    .catch(() => {})
}

const handleMarquerIntegrePGI = async (prestation: IRdvDetailed) => {
  if (!prestation.idRdv) return

  try {
    await rdvRealisesStore.marquerIntegrePGI(prestation.idRdv)
    await loadRdvRealises()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Erreur')
  }
}

const handleSelectionChange = (val: IRdvDetailed[]) => {
  selectedPrestations.value = val.map((p) => p.idRdv!).filter((id) => id !== undefined)
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// ===== LOAD DATA =====
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      prestationsStore.fetchAll(),
      categoriesStore.fetchAll(),
    ])
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des données')
  } finally {
    loading.value = false
  }
}

const loadRdvRealises = async () => {
  loading.value = true
  try {
    if (rdvRealisesTab.value === 'a-facturer') {
      await rdvRealisesStore.fetchAFacturer()
    } else if (rdvRealisesTab.value === 'facturees') {
      await rdvRealisesStore.fetchFacturees()
    } else {
      await rdvRealisesStore.fetchAll()
    }
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des prestations')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tabName: string) => {
  searchQuery.value = ''
  if (tabName === 'prestations-realisees') {
    loadRdvRealises()
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="prestations-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestion des Prestations</h1>
        <p class="page-subtitle">Prestations, catégories et suivi des réalisations</p>
      </div>
      <el-button
        v-if="activeTab === 'prestations-realisees' && selectedPrestations.length > 0"
        type="primary"
        :icon="Check"
        @click="handleMarquerPlusieurs"
      >
        Marquer {{ selectedPrestations.length }} comme facturée(s)
      </el-button>
      <el-button
        v-else-if="activeTab === 'prestations'"
        type="primary"
        :icon="Plus"
        @click="openCreateDialog"
      >
        Ajouter une prestation
      </el-button>
      <el-button
        v-else-if="activeTab === 'categories'"
        type="primary"
        :icon="Plus"
        @click="openCreateCategorieDialog"
      >
        Ajouter une catégorie
      </el-button>
    </div>

    <!-- Statistics for RDV Réalisés -->
    <el-row v-if="activeTab === 'prestations-realisees'" :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card stat-warning">
          <div class="stat-content">
            <el-icon class="stat-icon"><Clock /></el-icon>
            <div>
              <div class="stat-value">{{ rdvRealisesStore.prestationsAFacturer.length }}</div>
              <div class="stat-label">À facturer</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card stat-success">
          <div class="stat-content">
            <el-icon class="stat-icon"><Check /></el-icon>
            <div>
              <div class="stat-value">{{ rdvRealisesStore.prestationsFacturees.length }}</div>
              <div class="stat-label">Facturées</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card stat-info">
          <div class="stat-content">
            <el-icon class="stat-icon"><Document /></el-icon>
            <div>
              <div class="stat-value">{{ formatCurrency(rdvRealisesStore.montantTotalAFacturer) }}</div>
              <div class="stat-label">Montant à facturer</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Search Bar -->
    <el-card shadow="never" class="search-card">
      <el-input
        v-model="searchQuery"
        :placeholder="activeTab === 'prestations' ? 'Rechercher par nom ou catégorie...' :
                      activeTab === 'categories' ? 'Rechercher une catégorie...' :
                      'Rechercher par patient, infirmier ou prestation...'"
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </el-card>

    <!-- Tabs -->
    <el-card shadow="never" v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- TAB 1: PRESTATIONS -->
        <el-tab-pane label="Prestations" name="prestations">
          <el-table
            :data="filteredPrestations"
            style="width: 100%"
            stripe
            :default-sort="{ prop: 'nomPrestation', order: 'ascending' }"
          >
            <el-table-column type="index" label="#" width="60" />

            <el-table-column label="Prestation" min-width="300" sortable prop="nomPrestation">
              <template #default="{ row }">
                <div class="prestation-cell">
                  <el-icon class="prestation-icon" :size="24">
                    <Document />
                  </el-icon>
                  <div class="prestation-name">{{ row.nomPrestation }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Prix TTC" width="120" align="right" sortable prop="prix_TTC">
              <template #default="{ row }">
                <span class="font-semibold text-green-600">{{ formatCurrency(row.prix_TTC) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Catégorie" min-width="180" sortable>
              <template #default="{ row }">
                <el-tag v-if="row.categorie" type="info" size="large">
                  <el-icon class="mr-1"><Grid /></el-icon>
                  {{ row.categorie.nomCategorie }}
                </el-tag>
                <span v-else class="text-gray-400">Non catégorisée</span>
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="150" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    type="primary"
                    :icon="Edit"
                    size="small"
                    link
                    @click="openEditDialog(row)"
                  >
                    Modifier
                  </el-button>
                  <el-button
                    type="danger"
                    :icon="Delete"
                    size="small"
                    link
                    @click="handlePrestationDelete(row)"
                  >
                    Supprimer
                  </el-button>
                </div>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="Aucune prestation trouvée" />
            </template>
          </el-table>
        </el-tab-pane>

        <!-- TAB 2: CATEGORIES -->
        <el-tab-pane label="Catégories" name="categories">
          <el-table
            :data="filteredCategories"
            style="width: 100%"
            stripe
            :default-sort="{ prop: 'nomCategorie', order: 'ascending' }"
          >
            <el-table-column type="index" label="#" width="60" />

            <el-table-column label="Catégorie" min-width="300" sortable prop="nomCategorie">
              <template #default="{ row }">
                <div class="prestation-cell">
                  <el-icon class="prestation-icon" :size="24">
                    <Grid />
                  </el-icon>
                  <div class="prestation-name">{{ row.nomCategorie }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Nombre de prestations" width="200" align="center">
              <template #default="{ row }">
                <el-tag type="info">
                  {{ prestationsStore.prestations.filter(p => p.idCategorie === row.idCategorie).length }} prestation(s)
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="150" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    type="primary"
                    :icon="Edit"
                    size="small"
                    link
                    @click="openEditCategorieDialog(row)"
                  >
                    Modifier
                  </el-button>
                  <el-button
                    type="danger"
                    :icon="Delete"
                    size="small"
                    link
                    @click="handleCategorieDelete(row)"
                  >
                    Supprimer
                  </el-button>
                </div>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="Aucune catégorie trouvée" />
            </template>
          </el-table>
        </el-tab-pane>

        <!-- TAB 3: PRESTATIONS RÉALISÉES -->
        <el-tab-pane label="Prestations Réalisées" name="prestations-realisees">
          <el-tabs v-model="rdvRealisesTab" @tab-change="loadRdvRealises">
            <el-tab-pane
              v-for="tab in rdvRealisesTabs"
              :key="tab.name"
              :label="`${tab.label} (${tab.count})`"
              :name="tab.name"
            >
              <el-table
                :data="filteredRdvRealises"
                style="width: 100%"
                stripe
                @selection-change="handleSelectionChange"
              >
                <el-table-column v-if="rdvRealisesTab === 'a-facturer'" type="selection" width="55" />

                <el-table-column label="Patient" min-width="180">
                  <template #default="{ row }">
                    {{ row.patient?.prenomPatient }} {{ row.patient?.nomPatient }}
                  </template>
                </el-table-column>

                <el-table-column label="Infirmier" min-width="180">
                  <template #default="{ row }">
                    {{ row.employe?.prenomEmploye }} {{ row.employe?.nomEmploye }}
                  </template>
                </el-table-column>

                <el-table-column label="Prestation" min-width="200">
                  <template #default="{ row }">{{ row.prestation?.nomPrestation }}</template>
                </el-table-column>

                <el-table-column label="Date réalisée" width="160">
                  <template #default="{ row }">{{ formatDate(row.timestamp_RDV_reel) }}</template>
                </el-table-column>

                <el-table-column label="Montant" width="120" align="right">
                  <template #default="{ row }">
                    {{ formatCurrency(row.prestation?.prix_TTC || 0) }}
                  </template>
                </el-table-column>

                <el-table-column label="Actions" width="200" fixed="right">
                  <template #default="{ row }">
                    <div class="action-buttons">
                      <el-button
                        v-if="!row.timestamp_RDV_facture"
                        type="success"
                        :icon="Check"
                        size="small"
                        link
                        @click="handleMarquerFacturee(row)"
                      >
                        Facturer
                      </el-button>
                      <el-tag v-else type="success" :icon="DocumentChecked">Facturée</el-tag>

                      <el-button
                        v-if="row.timestamp_RDV_facture && !row.timestamp_RDV_integrePGI"
                        type="primary"
                        :icon="Upload"
                        size="small"
                        link
                        @click="handleMarquerIntegrePGI(row)"
                      >
                        Intégrer PGI
                      </el-button>
                    </div>
                  </template>
                </el-table-column>

                <template #empty>
                  <el-empty description="Aucune prestation trouvée" />
                </template>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Dialog: Create/Edit Prestation -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="prestationFormRef"
        :model="prestationForm"
        :rules="prestationFormRules"
        label-position="top"
        size="large"
      >
        <el-form-item label="Nom de la prestation" prop="nomPrestation">
          <el-input
            v-model="prestationForm.nomPrestation"
            placeholder="Ex: Injection, Pansement, Prélèvement sanguin..."
            :prefix-icon="Document"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Prix TTC (€)" prop="prix_TTC">
              <el-input-number
                v-model="prestationForm.prix_TTC"
                :min="0.01"
                :step="0.01"
                :precision="2"
                :controls="true"
                class="w-full"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Catégorie" prop="idCategorie">
              <el-select
                v-model="prestationForm.idCategorie"
                placeholder="Sélectionner une catégorie"
                class="w-full"
                :prefix-icon="Grid"
              >
                <el-option
                  v-for="categorie in categoriesStore.categories"
                  :key="categorie.idCategorie"
                  :label="categorie.nomCategorie"
                  :value="categorie.idCategorie"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Annuler</el-button>
        <el-button type="primary" :loading="loading" @click="handlePrestationSubmit">
          {{ isEditMode ? 'Modifier' : 'Créer' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Dialog: Create/Edit Catégorie -->
    <el-dialog
      v-model="categorieDialogVisible"
      :title="categorieDialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="categorieFormRef"
        :model="categorieForm"
        :rules="categorieFormRules"
        label-position="top"
        size="large"
      >
        <el-form-item label="Nom de la catégorie" prop="nomCategorie">
          <el-input
            v-model="categorieForm.nomCategorie"
            placeholder="Ex: Soins infirmiers, Analyses, Vaccinations..."
            :prefix-icon="Grid"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="categorieDialogVisible = false">Annuler</el-button>
        <el-button type="primary" :loading="loading" @click="handleCategorieSubmit">
          {{ isCategorieEditMode ? 'Modifier' : 'Créer' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.prestations-page {
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

.prestation-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prestation-icon {
  color: #0ea5e9;
  background: #e0f2fe;
  padding: 8px;
  border-radius: 8px;
}

.prestation-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>
