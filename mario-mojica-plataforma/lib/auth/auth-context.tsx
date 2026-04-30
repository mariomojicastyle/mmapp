"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { User, UserRole } from "./roles"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  setRole: (role: UserRole) => void
  originalRole: UserRole | null
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [originalRole, setOriginalRole] = useState<UserRole | null>(null)
  
  // Memoize supabase client to prevent infinite loops in useEffect
  const supabase = useMemo(() => createClient(), [])

  const mapSupabaseUser = useCallback((supabaseUser: any, profileData?: any): User => {
    const role = (profileData?.role || supabaseUser.user_metadata?.role || "viewer") as UserRole
    const name = profileData?.full_name || 
                 supabaseUser.user_metadata?.full_name || 
                 supabaseUser.user_metadata?.name || 
                 supabaseUser.email?.split('@')[0] || 
                 "Usuario"
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      role,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      company: profileData?.company || supabaseUser.user_metadata?.company
    }
  }, [])

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setUser(null)
        setOriginalRole(null)
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError)
      }

      const mappedUser = mapSupabaseUser(session.user, profile)
      setUser(mappedUser)
      setOriginalRole(mappedUser.role)
    } catch (err) {
      console.error("Auth initialization error:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, mapSupabaseUser])

  useEffect(() => {
    fetchUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        fetchUserData()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setOriginalRole(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserData])

  const setRole = useCallback((role: UserRole) => {
    setUser(prev => prev ? { ...prev, role } : null)
  }, [])

  const value = useMemo(() => ({ 
    user, 
    loading, 
    setRole, 
    originalRole,
    refreshUser: fetchUserData 
  }), [user, loading, setRole, originalRole, fetchUserData])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
