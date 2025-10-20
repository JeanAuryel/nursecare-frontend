<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore, usePatientsStore, useRdvStore } from '@/stores'
import { ElMessage, ElMessageBox } from 'element-plus'
import VueApexCharts from 'vue3-apexcharts'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import frLocale from '@fullcalendar/core/locales/fr'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Document, User, Calendar, TrendCharts } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const patientsStore = usePatientsStore()
const rdvStore = useRdvStore()

const loading = ref(true)
const selectedMonth = ref(new Date())

// Stats KPIs
const stats = ref({
  totalPatients: 0,
  totalRdvMois: 0,
  rdvRealises: 0,
  stagiairesActifs: 0,
})

// Chart configurations
const revenueChartOptions = ref({
  chart: {
    type: 'area',
    height: 350,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  colors: ['#0ea5e9', '#06b6d4'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.3,
    },
  },
  xaxis: {
    categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
  },
  yaxis: {
    title: { text: 'Revenus (€)' },
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val.toLocaleString('fr-FR')} €`,
    },
  },
})

const revenueChartSeries = ref([
  {
    name: 'Revenus',
    data: [12000, 15000, 13000, 17000, 16000, 18000, 20000, 19000, 21000, 23000, 22000, 25000],
  },
])

const rdvStatusChartOptions = ref({
  chart: {
    type: 'donut',
    height: 300,
  },
  labels: ['Réalisés', 'Planifiés', 'Annulés'],
  colors: ['#10b981', '#0ea5e9', '#ef4444'],
  legend: { position: 'bottom' },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total RDV',
            formatter: () => stats.value.totalRdvMois.toString(),
          },
        },
      },
    },
  },
})

const rdvStatusChartSeries = ref([65, 25, 10])

const performanceChartOptions = ref({
  chart: {
    type: 'bar',
    height: 350,
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4,
    },
  },
  dataLabels: { enabled: false },
  colors: ['#0ea5e9'],
  xaxis: {
    categories: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
  },
  yaxis: {
    title: { text: 'Nombre de RDV' },
  },
})

const performanceChartSeries = ref([
  {
    name: 'RDV réalisés',
    data: [44, 55, 41, 67],
  },
])

// Dialog for adding/editing internships
const internshipDialogVisible = ref(false)
const internshipForm = ref({
  title: '',
  schoolName: '',
  startDate: '',
  endDate: '',
  notes: '',
})

// Event handlers (must be declared before calendarOptions)
const handleEventClick = (info: any) => {
  ElMessageBox.alert(
    `École: ${info.event.extendedProps.schoolName || 'N/A'}<br>
     Date: ${format(info.event.start, 'dd/MM/yyyy', { locale: fr })}<br>
     Notes: ${info.event.extendedProps.notes || 'Aucune note'}`,
    info.event.title,
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: 'OK',
    }
  )
}

const handleDateSelect = (selectInfo: any) => {
  internshipForm.value.startDate = format(selectInfo.start, 'yyyy-MM-dd')
  internshipForm.value.endDate = format(selectInfo.end, 'yyyy-MM-dd')
  internshipDialogVisible.value = true
}

// FullCalendar configuration for internship management
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  locale: frLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listWeek',
  },
  events: [],
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  height: 'auto',
  eventClick: handleEventClick,
  select: handleDateSelect,
})

const saveInternship = () => {
  // Add event to calendar
  calendarOptions.value.events.push({
    title: `Stage - ${internshipForm.value.schoolName}`,
    start: internshipForm.value.startDate,
    end: internshipForm.value.endDate,
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
    extendedProps: {
      schoolName: internshipForm.value.schoolName,
      notes: internshipForm.value.notes,
    },
  })

  ElMessage.success('Stage ajouté avec succès')
  internshipDialogVisible.value = false
  resetInternshipForm()
}

const resetInternshipForm = () => {
  internshipForm.value = {
    title: '',
    schoolName: '',
    startDate: '',
    endDate: '',
    notes: '',
  }
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    // Fetch patients and rdv data
    await Promise.all([
      patientsStore.fetchAll(),
      rdvStore.fetchAll(),
    ])

    // Calculate stats
    stats.value.totalPatients = patientsStore.totalPatients
    stats.value.totalRdvMois = rdvStore.rdvs.length
    stats.value.rdvRealises = rdvStore.rdvs.filter(
      (rdv) => rdv.timestamp_RDV_reel
    ).length

    // Update charts
    const realises = rdvStore.rdvs.filter((r) => r.timestamp_RDV_reel).length
    const planifies = rdvStore.rdvs.filter((r) => !r.timestamp_RDV_reel).length
    rdvStatusChartSeries.value = [realises, planifies, 5] // Mock cancelled

  } catch (error) {
    ElMessage.error('Erreur lors du chargement des données')
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="directeur-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Tableau de bord Directeur</h1>
      <p class="dashboard-subtitle">
        Bienvenue, {{ authStore.fullName }} - Vue d'ensemble de l'activité
      </p>
    </div>

    <!-- KPI Cards -->
    <el-row :gutter="20" class="kpi-section">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-primary">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><User /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.totalPatients }}</span>
              <span class="kpi-label">Patients actifs</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-success">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Calendar /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.totalRdvMois }}</span>
              <span class="kpi-label">RDV ce mois</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-info">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><Document /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.rdvRealises }}</span>
              <span class="kpi-label">RDV réalisés</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card kpi-warning">
          <div class="kpi-content">
            <el-icon class="kpi-icon"><TrendCharts /></el-icon>
            <div class="kpi-details">
              <span class="kpi-value">{{ stats.stagiairesActifs }}</span>
              <span class="kpi-label">Stagiaires actifs</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Section -->
    <el-row :gutter="20" class="charts-section">
      <!-- Revenue Chart -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">Évolution des revenus annuels</span>
            </div>
          </template>
          <VueApexCharts
            type="area"
            height="350"
            :options="revenueChartOptions"
            :series="revenueChartSeries"
          />
        </el-card>
      </el-col>

      <!-- RDV Status Chart -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">Statut des RDV</span>
            </div>
          </template>
          <VueApexCharts
            type="donut"
            height="300"
            :options="rdvStatusChartOptions"
            :series="rdvStatusChartSeries"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- Performance Chart -->
    <el-row :gutter="20" class="charts-section">
      <el-col :xs="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">Performance hebdomadaire</span>
            </div>
          </template>
          <VueApexCharts
            type="bar"
            height="350"
            :options="performanceChartOptions"
            :series="performanceChartSeries"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- Internship Calendar -->
    <el-row :gutter="20" class="calendar-section">
      <el-col :xs="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">Calendrier des stages - Organisation avec les écoles</span>
              <el-button
                type="primary"
                size="small"
                @click="internshipDialogVisible = true"
              >
                Ajouter un stage
              </el-button>
            </div>
          </template>
          <FullCalendar :options="calendarOptions" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Add Internship Dialog -->
    <el-dialog
      v-model="internshipDialogVisible"
      title="Planifier un stage"
      width="500px"
    >
      <el-form :model="internshipForm" label-position="top">
        <el-form-item label="École" required>
          <el-input
            v-model="internshipForm.schoolName"
            placeholder="Nom de l'école"
          />
        </el-form-item>

        <el-form-item label="Date de début" required>
          <el-date-picker
            v-model="internshipForm.startDate"
            type="date"
            placeholder="Sélectionner"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="Date de fin" required>
          <el-date-picker
            v-model="internshipForm.endDate"
            type="date"
            placeholder="Sélectionner"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="Notes">
          <el-input
            v-model="internshipForm.notes"
            type="textarea"
            :rows="3"
            placeholder="Informations complémentaires..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="internshipDialogVisible = false">Annuler</el-button>
        <el-button type="primary" @click="saveInternship">Enregistrer</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.directeur-dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.kpi-section {
  margin-bottom: 24px;
}

.kpi-card {
  border-radius: 12px;
  border: none;
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-4px);
}

.kpi-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon {
  font-size: 40px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.kpi-primary .kpi-icon {
  color: #0ea5e9;
  background: #e0f2fe;
}

.kpi-success .kpi-icon {
  color: #10b981;
  background: #d1fae5;
}

.kpi-info .kpi-icon {
  color: #6366f1;
  background: #e0e7ff;
}

.kpi-warning .kpi-icon {
  color: #f59e0b;
  background: #fef3c7;
}

.kpi-details {
  display: flex;
  flex-direction: column;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.kpi-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.charts-section {
  margin-bottom: 24px;
}

.calendar-section {
  margin-bottom: 24px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
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

:deep(.fc) {
  font-family: inherit;
}

:deep(.fc-toolbar-title) {
  font-size: 18px !important;
  font-weight: 600;
}

:deep(.fc-button) {
  background: #0ea5e9 !important;
  border-color: #0ea5e9 !important;
  text-transform: capitalize;
}

:deep(.fc-button:hover) {
  background: #0369a1 !important;
  border-color: #0369a1 !important;
}

:deep(.fc-button-active) {
  background: #075985 !important;
  border-color: #075985 !important;
}

:deep(.fc-event) {
  cursor: pointer;
}

@media (max-width: 768px) {
  .dashboard-title {
    font-size: 24px;
  }

  .kpi-value {
    font-size: 24px;
  }
}
</style>
