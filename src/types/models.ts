// Enums
export enum RoleEmploye {
  INFIRMIER = 'INFIRMIER',
  DIRECTEUR = 'DIRECTEUR',
  SECRETAIRE = 'SECRETAIRE'
}

export enum StatutFacture {
  BROUILLON = 'BROUILLON',
  ENVOYEE = 'ENVOYEE',
  PAYEE = 'PAYEE',
  PARTIELLE = 'PARTIELLE',
  IMPAYEE = 'IMPAYEE',
  ANNULEE = 'ANNULEE'
}

export enum ModePaiement {
  ESPECES = 'ESPECES',
  CARTE = 'CARTE',
  CHEQUE = 'CHEQUE',
  VIREMENT = 'VIREMENT',
  MUTUELLE = 'MUTUELLE'
}

// Interfaces pour les modèles

export interface IEmploye {
  idEmploye?: number
  nomEmploye: string
  prenomEmploye: string
  mailEmploye: string
  mdpEmploye?: string // Optionnel car on ne le récupère pas depuis l'API
  roleEmploye: RoleEmploye
}

export interface IPatient {
  idPatient?: number
  nomPatient: string
  prenomPatient: string
  adressePatient: string
  numPatient: string
  mailPatient: string
}

export interface IStagiaire {
  idStagiaire?: number
  nomStagiaire: string
  prenomStagiaire: string
  idEcole: number
  idTuteur?: number
  mailStagiaire?: string
  numStagiaire?: string
  dateDebutStage?: string
  dateFinStage?: string
  ecole?: IEcole // Relation pour affichage
  tuteur?: {
    idEmploye: number
    nomEmploye: string
    prenomEmploye: string
  }
  notes?: Array<{
    idRdv: number
    noteStagiaire: number
    commentaireStagiaire: string
    dateRdv: string
    nomPrestation: string
  }>
}

export interface IEcole {
  idEcole?: number
  nomEcole: string
  adresseEcole: string
  villeEcole: string
  codePostalEcole: string
  numEcole: string
  contactReferent: string
  stagiaires?: IStagiaire[] // Pour afficher les stagiaires de cette école
}

export interface IPrestation {
  idPrestation?: number
  nomPrestation: string
  prix_TTC: number
  idCategorie: number
  categorie?: ICategorie // Relation pour affichage
}

export interface ICategorie {
  idCategorie?: number
  nomCategorie: string
}

export interface IRdv {
  idRdv?: number
  idEmploye: number
  idPrestation: number
  idPatient: number
  idStagiaire: number
  timestamp_RDV_prevu: Date | string
  timestamp_RDV_reel?: Date | string | null
  timestamp_RDV_facture?: Date | string | null
  timestamp_RDV_integrePGI?: Date | string | null
  noteStagiaire?: number | null
  commentaireStagiaire?: string | null
  // Relations pour affichage
  employe?: IEmploye
  prestation?: IPrestation
  patient?: IPatient
  stagiaire?: IStagiaire
}

// Interface pour les données étendues de RDV (avec toutes les infos)
export interface IRdvDetailed extends IRdv {
  employe: IEmploye
  prestation: IPrestation
  patient: IPatient
  stagiaire: IStagiaire
}

export interface IFacture {
  idFacture?: number
  numeroFacture: string
  idPatient: number
  dateFacture: Date | string
  dateEcheance: Date | string
  montantHT: number
  montantTVA: number
  montantTTC: number
  montantPaye?: number
  statutFacture: StatutFacture
  modePaiement?: ModePaiement
  datePaiement?: Date | string | null
  notes?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface ILigneFacture {
  idLigne?: number
  idFacture: number
  idPrestation: number
  idRdv?: number
  description: string
  quantite: number
  prixUnitaire: number
  montantHT: number
  tauxTVA: number
  montantTVA: number
  montantTTC: number
  // Relations pour affichage
  prestation?: {
    nomPrestation: string
  }
}

export interface IFactureDetailed extends IFacture {
  patient?: {
    idPatient: number
    nomPatient: string
    prenomPatient: string
    adressePatient: string
    numPatient: string
    mailPatient?: string
  }
  lignes?: ILigneFacture[]
}

// Types utilitaires pour les formulaires
export type IEmployeForm = Omit<IEmploye, 'idEmploye'>
export type IPatientForm = Omit<IPatient, 'idPatient'>
export type IStagiaireForm = Omit<IStagiaire, 'idStagiaire'>
export type IEcoleForm = Omit<IEcole, 'idEcole'>
export type IPrestationForm = Omit<IPrestation, 'idPrestation'>
export type ICategorieForm = Omit<ICategorie, 'idCategorie'>
export type IRdvForm = Omit<IRdv, 'employe' | 'prestation' | 'patient' | 'stagiaire'>
export type IFactureForm = Omit<IFacture, 'idFacture' | 'numeroFacture' | 'createdAt' | 'updatedAt'>
export type ILigneFactureForm = Omit<ILigneFacture, 'idLigne' | 'prestation'>
