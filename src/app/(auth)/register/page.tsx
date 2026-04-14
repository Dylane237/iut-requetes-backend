'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'

const registerSchema = z.object({
    nom: z.string().min(2, 'Minimum 2 caractères'),
    prenom: z.string().min(2, 'Minimum 2 caractères'),
    matricule: z.string().min(4, 'Matricule invalide'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterForm) => {
        setError('')
        setIsLoading(true)
        try {
            await axiosInstance.post('/auth/register/', {
                nom: data.nom,
                prenom: data.prenom,
                matricule: data.matricule,
                email: data.email,
                password: data.password,
            })
            router.push('/login')
        } catch {
            setError('Erreur lors de l\'inscription. Vérifiez vos informations.')
        } finally {
            setIsLoading(false)
        }
    }

    const fields = [
        { name: 'nom' as const, label: 'Nom' },
        { name: 'prenom' as const, label: 'Prénom' },
        { name: 'matricule' as const, label: 'Matricule' },
        { name: 'email' as const, label: 'Email' },
        { name: 'password' as const, label: 'Mot de passe', type: 'password' },
        { name: 'confirmPassword' as const, label: 'Confirmer le mot de passe', type: 'password' },
    ]

    return (
        <div className="min-h-screen flex items-center justify-center py-8" style={{ backgroundColor: '#0d2137' }}>
            <div className="w-full max-w-sm mx-4 rounded-2xl p-8" style={{ backgroundColor: '#0f2d45' }}>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-widest">JANNGO</h1>
                    <p className="text-sm mt-1" style={{ color: '#7a9bb5' }}>Créer un compte étudiant</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-xs mb-1" style={{ color: '#7a9bb5' }}>
                                {field.label}
                            </label>
                            <input
                                {...register(field.name)}
                                type={field.type || 'text'}
                                className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: '#1a3a52',
                                    border: errors[field.name] ? '1px solid #e24b4a' : '1px solid transparent',
                                }}
                            />
                            {errors[field.name] && (
                                <p className="text-xs mt-1" style={{ color: '#e24b4a' }}>
                                    {errors[field.name]?.message}
                                </p>
                            )}
                        </div>
                    ))}

                    {error && (
                        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#3d1a1a', color: '#e24b4a' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-lg font-semibold text-sm tracking-widest transition-all mt-2"
                        style={{
                            backgroundColor: isLoading ? '#1a3a52' : '#2a5a7c',
                            color: isLoading ? '#7a9bb5' : '#ffffff',
                        }}
                    >
                        {isLoading ? 'INSCRIPTION...' : "S'INSCRIRE"}
                    </button>
                </form>

                <p className="text-center text-xs mt-6" style={{ color: '#7a9bb5' }}>
                    Déjà un compte ?{' '}
                    <a href="/login" style={{ color: '#4a9eca' }} className="hover:underline">
                        Se connecter
                    </a>
                </p>
            </div>
        </div>
    )
}