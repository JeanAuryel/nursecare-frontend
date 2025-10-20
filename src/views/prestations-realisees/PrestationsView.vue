<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePrestationsReali seesStore } from '@/stores/prestationsRealisees'
import {
  Search,
  Check,
  Clock,
  DocumentChecked,
  Upload,
  Document
} from '@element-plus/icons-vue'
import type { IRdvDetailed } from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const prestationsStore = usePrestationsReali seesStore()

const loading = ref(false)
const searchQuery = ref('')
const activeTab = ref<'toutes' | 'a-facturer' | 'facturees'>('a-facturer')
const selectedPrestations = ref<number[]>([])

const filteredPrestations = computed(() => {
  let prestations = prestationsStore.prestations

  if (activeTab.value === 'a-facturer') {
    prestations = prestationsStore.prestationsAFacturer
  } else if (activeTab.value === 'facturees') {
    prestations = prestationsStore.prestationsFacturees
  }

  if (searchQuery.value) {
    prestations = prestationsStore.searchPrestations(searchQuery.value)
      .filter((p) => {
        if (activeTab.value === 'a-facturer') return p.timestamp_RDV_reel && !p.timestamp_RDV_facture
        if (activeTab.value === 'facturees') return p.timestamp_RDV_facture
        return true
      })
  }

  return prestations
})

const tabs = computed(() => [
  { label: 'Toutes', name: 'toutes' as const, count: prestationsStore.totalPrestations },
  { label: 'À facturer', name: 'a-facturer' as const, count: prestationsStore.prestationsAFacturer.length },
  { label: 'Facturées', name: 'facturees' as const, count: prestationsStore.prestationsFacturees.length }
])

const handleMarquerFacturee = async (prestation: IRdvDetailed) => {
  if (!prestation.idRdv) return

  ElMessageBox.confirm('Marquer cette prestation comme facturée ?', 'Confirmation', {
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler',
    type: 'info'
  })
    .then(async () => {
      try {
        await prestationsStore.marquerFacturee(prestation.idRdv!)
        await loadData()
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
        await prestationsStore.marquerPlusieursFacturees(selectedPrestations.value)
        selectedPrestations.value = []
        await loadData()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || 'Erreur')
      }
    })
    .catch(() => {})
}

const handleMarquerIntegrePGI = async (prestation: IRdvDetailed) => {
  if (!prestation.idRdv) return

  try {
    await prestationsStore.marquerIntegrePGI(prestation.idRdv)
    await loadData()
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

const loadData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'a-facturer') {
      await prestationsStore.fetchAFacturer()
    } else if (activeTab.value === 'facturees') {
      await prestationsStore.fetchFacturees()
    } else {
      await prestationsStore.fetchAll()
    }
  } catch (error) {
    ElMessage.error('Erreur lors du chargement des prestations')
  } finally {
    loading.value = false
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
        <h1 class="page-title">Prestations Réalisées</h1>
        <p class="page-subtitle">
          {{ prestationsStore.totalPrestations }} prestation(s) réalisée(s)
        </p>
      </div>
      <el-button
        v-if="selectedPrestations.length > 0"
        type="primary"
        :icon="Check"
        @click="handleMarquerPlusieurs"
      >
        Marquer {{ selectedPrestations.length }} comme facturée(s)
      </el-button>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card stat-warning">
          <div class="stat-content">
            <el-icon class="stat-icon"><Clock /></el-icon>
            <div>
              <div class="stat-value">{{ prestationsStore.prestationsAFacturer.length }}</div>
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
              <div class="stat-value">{{ prestationsStore.prestationsFacturees.length }}</div>
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
              <div class="stat-value">{{ formatCurrency(prestationsStore.montantTotalAFacturer) }}</div>
              <div class="stat-label">Montant à facturer</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="search-card">
      <el-input
        v-model="searchQuery"
        placeholder="Rechercher par patient, infirmier ou prestation..."
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </el-card>

    <el-card shadow="never" v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.name"
          :label="`${tab.label} (${tab.count})`"
          :name="tab.name"
        >
          <el-table
            :data="filteredPrestations"
            style="width: 100%"
            stripe
            @selection-change="handleSelectionChange"
          >
            <el-table-column v-if="activeTab === 'a-facturer'" type="selection" width="55" />

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
    </el-card>
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
}
</style>
