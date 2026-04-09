import { supabase } from "./supabaseClient";

const API_BASE = "http://127.0.0.1:3001/api";

export async function apiFetch(endpoint: string, options: any = {}) {
    try {
        const {
        data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
            ...options.headers,
        },
        });

        if (!res.ok) {
        const text = await res.text();
        console.error("API Error:", text);
        }

        return res;

    } catch (err) {
        console.error("Network error:", err);
        throw err;
    }
}