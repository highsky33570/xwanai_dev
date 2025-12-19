// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSPAXWANAIClient } from '../supabase/client';
import { logger } from '../utils/logger';
import { User } from '@supabase/supabase-js';
import { Store } from '@/store';
import { useDimensionCategories, useMainCategories } from '@/hooks/use-data-queries';


interface GlobalContextType {
    loading: boolean;
    user: User | null;  // Add this
    supaToken: SupaTokenType | null;  // Add this
    mainCategories: any | null;  // Add this
    dimensionCategories: any | null;  // Add this
    // ⬇️ Add setter functions:
    setUser: (user: User | null) => void;
    setSupaToken: (token: SupaTokenType | null) => void;
}

interface SupaTokenType {
    access_token?: string;
    expires_at?: number;
    expires_in?: number;
    refresh_token?: string;
    token_type?: string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function AppGlobalProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);  // Add this
    const [supaToken, setSupaToken] = useState<SupaTokenType | null>(null);
    const { data: mainCategories = [] } = useMainCategories();
    const { data: dimensionCategories = [] } = useDimensionCategories();

    useEffect(() => {
        async function loadData() {

            try {
                const supabase = await createSPAXWANAIClient();
                const client = supabase.getSupabaseClient();

                // Get user data
                const { data: { user } } = await client.auth.getUser();

                if (user) {
                    setUser(user);
                } else {
                    // throw new Error('User not found');
                    // console.error('User not foud');
                    setUser(null);
                    Store.user.clearUser();
                }

                client.auth.onAuthStateChange((event, session) => {
                    console.log("onAuthState: ", event, session);

                    setSupaToken({
                        access_token: session?.access_token,
                        expires_at: session?.expires_at,
                        expires_in: session?.expires_in,
                        refresh_token: session?.refresh_token,
                        token_type: session?.token_type,
                    });
                    let updatedUser: User | null = session?.user ?? null;
                    if (updatedUser) {
                        Store.user.setUser({
                            id: updatedUser.id,
                            email: updatedUser.email ?? "",
                            username: updatedUser.user_metadata?.username ?? "",
                            avatar_url: updatedUser.user_metadata?.avatar_url ?? "",
                        });
                    } else {
                        Store.user.clearUser();
                    }

                    setUser(updatedUser);
                })

            } catch (error) {
                setUser(user);
                Store.user.clearUser();
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <GlobalContext.Provider value={{
            loading, user, supaToken, mainCategories, dimensionCategories, setUser,
            setSupaToken
        }}>
            {children}
        </GlobalContext.Provider>
    );
}

export const useAppGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};