export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  matricule: string
  role: 'etudiant' | 'admin' | 'scolarite'
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  matricule: string
  password: string
  role: 'etudiant' | 'admin'
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}