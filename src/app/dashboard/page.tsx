'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
    const { user, logout } = useAuth()

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d2137' }}>
            <div className="text-center text-white">
                <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
                <p style={{ color: '#7a9bb5' }}>
                    Connecté en tant que : {user?.prenom} {user?.nom}
                </p>
                <button
                    onClick={logout}
                    className="mt-6 px-6 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: '#2a5a7c', color: '#fff' }}
                >
                    Déconnexion
                </button>
            </div>
        </div>
    )
}