<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStatsStore } from '@/stores'
import { TrendCharts, User, Calendar, Money, DocumentChecked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const statsStore = useStatsStore()
const loading = ref(false)
const selectedYear = ref(new Date().getFullYear())
const activeTab = ref('general')

// Data refs
const dashboardData = ref<any>(null)
const financierData = ref<any>(null)
const rdvData = ref<any>(null)
const caParEmploye = ref<any[]>([])
const rdvParMois = ref<any[]>([])
const topPatients = ref<any[]>([])
const prestationsPopulaires = ref<any[]>([])

const loadAllStats = async () => {
  loading.value = true
  try {
    const [dashboard, financier, rdv, employes, mois, patients, prestations] = await Promise.all([
      statsStore.getDashboard(),
      statsStore.getFinancierGlobal(),
      statsStore.getRDVGlobal(),
      statsStore.getCAParEmploye(),
      statsStore.getRDVParMois(selectedYear.value),
      statsStore.getTopPatients(10),
      statsStore.getPrestationsPopulaires(10)
    ])

    dashboardData.value = dashboard
    financierData.value = financier
    rdvData.value = rdv
    caParEmploye.value = employes
    rdvParMois.value = mois
    topPatients.value = patients
    prestationsPopulaires.value = prestations
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || 'Erreur lors du chargement des statistiques')
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return new Intl.NumberFormat('fr-FR').format(value)
}

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  return `${value.toFixed(1)}%`
}

onMounted(() => {
  loadAllStats()
})
</script>

<template>
  <div class="statistiques-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Statistiques</h1>
        <p class="page-subtitle">Vue d'ensemble des performances et activités</p>
      </div>
      <el-select v-model="selectedYear" @change="loadAllStats" style="width: 150px">
        <el-option :value="2023" label="2023" />
        <el-option :value="2024" label="2024" />
        <el-option :value="2025" label="2025" />
      </el-select>
    </div>

    <el-tabs v-model="activeTab" class="stats-tabs">
      <el-tab-pane label="Vue Générale" name="general">
        <div v-loading="loading">
          <!-- KPIs Globaux -->
          <el-row :gutter="20" class="kpi-row">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card stat-primary">
            <div class="stat-content">
              <el-icon class="stat-icon" :size="40"><Money /></el-icon>
              <div>
                <div class="stat-value">{{ dashboardData ? formatCurrency(dashboardData.chiffreAffairesTotal || 0) : '-' }}</div>
                <div class="stat-label">Chiffre d'affaires</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card stat-success">
            <div class="stat-content">
              <el-icon class="stat-icon" :size="40"><Calendar /></el-icon>
              <div>
                <div class="stat-value">{{ rdvData ? formatNumber(rdvData.realises || 0) : '-' }}</div>
                <div class="stat-label">RDV réalisés</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card stat-info">
            <div class="stat-content">
              <el-icon class="stat-icon" :size="40"><User /></el-icon>
              <div>
                <div class="stat-value">{{ dashboardData ? formatNumber(dashboardData.patients || 0) : '-' }}</div>
                <div class="stat-label">Patients</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="stat-card stat-warning">
            <div class="stat-content">
              <el-icon class="stat-icon" :size="40"><DocumentChecked /></el-icon>
              <div>
                <div class="stat-value">{{ rdvData ? formatPercent(rdvData.tauxRealisation) : '-' }}</div>
                <div class="stat-label">Taux de réalisation</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Graphiques principaux -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">CA par employé</span>
              </div>
            </template>
            <el-table :data="caParEmploye" style="width: 100%" stripe>
              <el-table-column label="Employé" min-width="150">
                <template #default="{ row }">
                  {{ row.prenomEmploye }} {{ row.nomEmploye }}
                </template>
              </el-table-column>
              <el-table-column label="CA Prestations" width="130" align="right">
                <template #default="{ row }">
                  <span class="font-semibold text-blue-600">{{ formatCurrency(row.caPrestationsRealisees || 0) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="CA Facturé" width="130" align="right">
                <template #default="{ row }">
                  <span class="font-semibold text-green-600">{{ formatCurrency(row.montantTotalFacture || 0) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="RDV" width="80" align="center">
                <template #default="{ row }">
                  <el-tag type="info">{{ formatNumber(row.nombrePrestations || 0) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">10 Derniers Patients</span>
              </div>
            </template>
            <el-table :data="topPatients" style="width: 100%" stripe :expand-row-keys="[]">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="patient-details">
                    <h4>Prestations réalisées :</h4>
                    <el-table :data="row.prestations" size="small" style="width: 100%">
                      <el-table-column label="Prestation" prop="nomPrestation" min-width="180" />
                      <el-table-column label="Prix unitaire" width="120" align="right">
                        <template #default="{ row: prestation }">
                          {{ formatCurrency(prestation.prix_TTC) }}
                        </template>
                      </el-table-column>
                      <el-table-column label="Quantité" width="100" align="center" prop="nombre_fois" />
                      <el-table-column label="Total" width="120" align="right">
                        <template #default="{ row: prestation }">
                          <span class="font-semibold">{{ formatCurrency(prestation.montant_total) }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Patient" min-width="150">
                <template #default="{ row }">
                  {{ row.prenomPatient }} {{ row.nomPatient }}
                </template>
              </el-table-column>
              <el-table-column label="RDV" width="80" align="center">
                <template #default="{ row }">
                  <el-tag type="info">{{ formatNumber(row.nombre_rdv) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Total" width="120" align="right">
                <template #default="{ row }">
                  <span class="font-semibold text-green-600">{{ formatCurrency(row.montant_total) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- RDV par mois et prestations populaires -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">RDV par mois ({{ selectedYear }})</span>
              </div>
            </template>
            <el-table :data="rdvParMois" style="width: 100%" stripe>
              <el-table-column label="Mois" width="100">
                <template #default="{ row }">
                  {{ row.mois }}/{{ row.annee }}
                </template>
              </el-table-column>
              <el-table-column label="Prévus" width="100" align="center">
                <template #default="{ row }">
                  <el-tag>{{ formatNumber(row.total_prevus) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Réalisés" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="success">{{ formatNumber(row.total_realises) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Taux" width="100" align="center">
                <template #default="{ row }">
                  {{ formatPercent(row.taux_realisation) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">Prestations populaires</span>
              </div>
            </template>
            <el-table :data="prestationsPopulaires" style="width: 100%" stripe>
              <el-table-column label="Prestation" min-width="200">
                <template #default="{ row }">
                  {{ row.nomPrestation }}
                </template>
              </el-table-column>
              <el-table-column label="Quantité" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="warning">{{ formatNumber(row.nombre_fois) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="CA Total" width="140" align="right">
                <template #default="{ row }">
                  <span class="font-semibold text-green-600">{{ formatCurrency(row.ca_total) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Facturation" name="facturation">
        <div v-loading="loading">
          <!-- Statistiques financières globales -->
          <el-row :gutter="20" class="kpi-row">
            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card stat-primary">
                <div class="stat-content">
                  <el-icon class="stat-icon" :size="40"><Money /></el-icon>
                  <div>
                    <div class="stat-value">{{ financierData ? formatCurrency(financierData.chiffreAffairesTotal || 0) : '-' }}</div>
                    <div class="stat-label">CA Total</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card stat-success">
                <div class="stat-content">
                  <el-icon class="stat-icon" :size="40"><DocumentChecked /></el-icon>
                  <div>
                    <div class="stat-value">{{ financierData ? formatCurrency(financierData.montantPaye || 0) : '-' }}</div>
                    <div class="stat-label">Montant Payé</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card stat-warning">
                <div class="stat-content">
                  <el-icon class="stat-icon" :size="40"><Calendar /></el-icon>
                  <div>
                    <div class="stat-value">{{ financierData ? formatCurrency(financierData.montantImpaye || 0) : '-' }}</div>
                    <div class="stat-label">Montant Impayé</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :md="6">
              <el-card shadow="hover" class="stat-card stat-info">
                <div class="stat-content">
                  <el-icon class="stat-icon" :size="40"><TrendCharts /></el-icon>
                  <div>
                    <div class="stat-value">{{ financierData ? formatPercent((financierData.montantPaye / financierData.chiffreAffairesTotal * 100) || 0) : '-' }}</div>
                    <div class="stat-label">Taux de Paiement</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- Tableaux détaillés -->
          <el-row :gutter="20" class="charts-row">
            <el-col :xs="24" :md="12">
              <el-card shadow="never">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">CA par employé</span>
                  </div>
                </template>
                <el-table :data="caParEmploye" style="width: 100%" stripe>
                  <el-table-column label="Employé" min-width="150">
                    <template #default="{ row }">
                      {{ row.prenomEmploye }} {{ row.nomEmploye }}
                    </template>
                  </el-table-column>
                  <el-table-column label="CA Prestations" width="130" align="right">
                    <template #default="{ row }">
                      <span class="font-semibold text-blue-600">{{ formatCurrency(row.caPrestationsRealisees || 0) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="CA Facturé" width="130" align="right">
                    <template #default="{ row }">
                      <span class="font-semibold text-green-600">{{ formatCurrency(row.montantTotalFacture || 0) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="RDV" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag type="info">{{ formatNumber(row.nombrePrestations || 0) }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-card shadow="never">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">10 Derniers Patients (Facturation)</span>
                  </div>
                </template>
                <el-table :data="topPatients" style="width: 100%" stripe :expand-row-keys="[]">
                  <el-table-column type="expand">
                    <template #default="{ row }">
                      <div class="patient-details">
                        <h4>Prestations réalisées :</h4>
                        <el-table :data="row.prestations" size="small" style="width: 100%">
                          <el-table-column label="Prestation" prop="nomPrestation" min-width="180" />
                          <el-table-column label="Prix unitaire" width="120" align="right">
                            <template #default="{ row: prestation }">
                              {{ formatCurrency(prestation.prix_TTC) }}
                            </template>
                          </el-table-column>
                          <el-table-column label="Quantité" width="100" align="center" prop="nombre_fois" />
                          <el-table-column label="Total" width="120" align="right">
                            <template #default="{ row: prestation }">
                              <span class="font-semibold">{{ formatCurrency(prestation.montant_total) }}</span>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="Patient" min-width="150">
                    <template #default="{ row }">
                      {{ row.prenomPatient }} {{ row.nomPatient }}
                    </template>
                  </el-table-column>
                  <el-table-column label="RDV" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag type="info">{{ formatNumber(row.nombre_rdv || 0) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="Total" width="120" align="right">
                    <template #default="{ row }">
                      <span class="font-semibold text-green-600">{{ formatCurrency(row.montant_total || 0) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>

          <!-- Prestations populaires -->
          <el-row :gutter="20" class="charts-row">
            <el-col :xs="24">
              <el-card shadow="never">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">Prestations populaires</span>
                  </div>
                </template>
                <el-table :data="prestationsPopulaires" style="width: 100%" stripe>
                  <el-table-column label="Prestation" min-width="200">
                    <template #default="{ row }">
                      {{ row.nomPrestation }}
                    </template>
                  </el-table-column>
                  <el-table-column label="Quantité" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag type="warning">{{ formatNumber(row.nombre_fois || 0) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="CA Total" width="140" align="right">
                    <template #default="{ row }">
                      <span class="font-semibold text-green-600">{{ formatCurrency(row.ca_total || 0) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.statistiques-page {
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

.kpi-row {
  margin-bottom: 24px;
}

.charts-row {
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
  padding: 12px;
  border-radius: 12px;
}

.stat-primary .stat-icon {
  background: #dbeafe;
  color: #2563eb;
}

.stat-success .stat-icon {
  background: #d1fae5;
  color: #059669;
}

.stat-info .stat-icon {
  background: #e0f2fe;
  color: #0ea5e9;
}

.stat-warning .stat-icon {
  background: #fef3c7;
  color: #d97706;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.stats-tabs {
  margin-top: 8px;
}

.stats-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.stats-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

.patient-details {
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.patient-details h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
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

  .stat-value {
    font-size: 20px;
  }
}
</style>
