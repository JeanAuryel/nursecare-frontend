import type { IEmploye, RoleEmploye } from './models'

// Réponses de l'API

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Auth
export interface LoginCredentials {
  mailEmploye: string
  mdpEmploye: string
}

export interface LoginResponse {
  message: string
  accessToken: string
  refreshToken: string
  employe: {
    id: number
    nom: string
    prenom: string
    role: RoleEmploye
  }
}

export interface JwtPayload {
  idEmploye: number
  roleEmploye: RoleEmploye
  iat?: number
  exp?: number
}

// Statistiques pour les dashboards
export interface DashboardStats {
  totalPatients?: number
  totalRdvJour?: number
  totalRdvMois?: number
  totalStagiaires?: number
  totalPrestations?: number
  revenuMois?: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
  }[]
}

// Filtres et options
export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  [key: string]: any
}
