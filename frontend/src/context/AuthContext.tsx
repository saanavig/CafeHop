import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../api/supabaseClient";

type AuthContextType = {
    user: SupabaseUser | null;
    loading: boolean;
    onboarded: boolean;
    signOut: () => Promise<void>;
    };

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    const signOut = async () => {
    await supabase.auth.signOut();
    };

    export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboarded, setOnboarded] = useState(false);

    useEffect(() => {
        const initializeUser = async () => {
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        console.log("INITIAL USER:", user);

        const isOnboarded = user?.user_metadata?.onboarded === true;

        setUser(user);
        setOnboarded(isOnboarded);
        setLoading(false);
        };

        initializeUser();

        const {
        data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("AUTH EVENT:", _event);

        setLoading(true);

        if (session?.user) {
            const user = session.user;

            console.log("AUTH CHANGE USER:", user);

            const isOnboarded = user?.user_metadata?.onboarded === true;

            setUser(user);
            setOnboarded(isOnboarded);
        } else {
            setUser(null);
            setOnboarded(false);
        }

        setLoading(false);
        });

        return () => {
        subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, onboarded, signOut }}>
        {children}
        </AuthContext.Provider>
    );
    };

    export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
    };