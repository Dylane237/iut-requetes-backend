'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { User, LoginCredentials, AuthTokens } from '@/types'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Vérifie si l'utilisateur est déjà connecté au chargement
    useEffect(() => {
        const token = Cookies.get('access_token')
        if (token) {
            fetchCurrentUser()
        } else {
            setIsLoading(false)
        }
    }, [])

    const fetchCurrentUser = async () => {
        try {
            const response = await axiosInstance.get('/auth/me/')
            setUser(response.data)
        } catch {
            Cookies.remove('access_token')
            Cookies.remove('refresh_token')
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (credentials: LoginCredentials) => {
        const response = await axiosInstance.post<AuthTokens>('/auth/login/', credentials)
        const { access, refresh } = response.data

        Cookies.set('access_token', access, { expires: 1 })
        Cookies.set('refresh_token', refresh, { expires: 7 })

        await fetchCurrentUser()

        // Redirection selon le rôle
        if (credentials.role === 'admin') {
            router.push('/admin/dashboard')
        } else {
            router.push('/dashboard')
        }
    }

    const logout = () => {
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        setUser(null)
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider')
    }
    return context
}