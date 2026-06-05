import { create } from "zustand";
const API_URL = "http://localhost:5000/api";

export const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('afrizend_token') || null,

    login: async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const data = await res.json().catch(()=>({}));
            throw new Error(data.error || 'Login failed');
        }
        const data = await res.json();
        localStorage.setItem('afrizend_token', data.token);
        set({ user: data.user, token: data.token });
        return data.user;
    },

    register: async (userData) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const data = await res.json().catch(()=>({}));
            throw new Error(data.error || 'Registration failed');
        }
        const data = await res.json();
        localStorage.setItem('afrizend_token', data.token);
        set({ user: data.user, token: data.token });
        return data.user;
    },

    logout: () => {
        localStorage.removeItem('afrizend_token');
        set({ user: null, token: null });
    },

    fetchMe: async () => {
        const token = localStorage.getItem('afrizend_token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const user = await res.json();
                set({ user });
            } else {
                localStorage.removeItem('afrizend_token');
                set({ user: null, token: null });
            }
        } catch (e) {
            console.error("Failed to fetch user", e);
        }
    },

    fundWallet: async (amount) => {
        const token = localStorage.getItem('afrizend_token');
        if (!token) return;
        const res = await fetch(`${API_URL}/wallet/fund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount })
        });
        if (!res.ok) {
            const data = await res.json().catch(()=>({}));
            throw new Error(data.error || 'Funding failed');
        }
        const data = await res.json();
        set((state) => ({ user: { ...state.user, balance: data.balance } }));
    },

    withdrawWallet: async (amount) => {
        const token = localStorage.getItem('afrizend_token');
        if (!token) return;
        const res = await fetch(`${API_URL}/wallet/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount })
        });
        if (!res.ok) {
            const data = await res.json().catch(()=>({}));
            throw new Error(data.error || 'Withdrawal failed');
        }
        const data = await res.json();
        set((state) => ({ user: { ...state.user, balance: data.balance } }));
    },

    issueVirtualWallet: async () => {
        const token = localStorage.getItem('afrizend_token');
        if (!token) return;
        const res = await fetch(`${API_URL}/wallet/virtual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const data = await res.json().catch(()=>({}));
            throw new Error(data.error || 'Virtual wallet issuance failed');
        }
        const data = await res.json();
        set((state) => ({ 
            user: { 
                ...state.user, 
                virtual_account_number: data.account.account_number,
                virtual_bank_name: data.account.bank_name,
                virtual_account_reference: data.account.account_reference
            } 
        }));
        return data.account;
    }
}));

export const useUIStore = create((set) => ({
    sidebarOpen: false,
    notifications: 3,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
