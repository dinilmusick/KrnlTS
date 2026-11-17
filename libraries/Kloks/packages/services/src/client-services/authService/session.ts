import { UserAccount } from '@kloks/state-graph';
import { IAuthStore } from './types';

const STORAGE_KEY_TOKEN = 'docustackAuthToken';
const STORAGE_KEY_USER = 'docustack_user_account';
const STORAGE_KEY_USERS_DB = 'depm_registered_users_db';

export async function loadDatabase(store: any) {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (stored) {
        const parsed: UserAccount[] = JSON.parse(stored);
        const seenIds = new Set<string>();
        parsed.forEach((u) => {
          if (u && u.email) {
            const emailKey = u.email.toLowerCase();
            let id = u.id || `usr_${Math.random().toString(36).substring(2, 8)}`;
            if (seenIds.has(id)) {
              id = `${id}_${Math.random().toString(36).substring(2, 6)}`;
            }
            seenIds.add(id);
            store.users.set(emailKey, { ...u, id, email: emailKey });
          }
        });
      }
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch('/api/auth/users');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        const existingIds = new Set(Array.from(store.users.values()).map((u: any) => u.id));
        data.users.forEach((u: UserAccount) => {
          if (u && u.email) {
            const emailKey = u.email.toLowerCase();
            if (!store.users.has(emailKey)) {
              let id = u.id || `usr_${Math.random().toString(36).substring(2, 8)}`;
              if (existingIds.has(id)) {
                id = `${id}_${Math.random().toString(36).substring(2, 6)}`;
              }
              existingIds.add(id);
              store.users.set(emailKey, { ...u, id, email: emailKey });
            }
          }
        });
      }
    }
  } catch {
    // ignore
  }
  store.persistDatabase();
  store.notify();
}

export function persistDatabase(store: any) {
  try {
    if (typeof window !== 'undefined') {
      const arr = store.getRegisteredUsers();
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}

export function restoreSession(store: any) {
  try {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (storedToken && storedUser) {
        store.token = storedToken;
        store.currentUser = JSON.parse(storedUser);
      } else {
        store.token = null;
        store.currentUser = null;
      }
    }
  } catch {
    store.token = null;
    store.currentUser = null;
  }
}

export function setSession(store: any, user: any, customToken?: string) {
  const token = customToken || `sess::${user.id}::${Date.now()}::${Math.random().toString(36).substring(2, 10)}`;
  const { passwordHash: _, ...safeUser } = user;
  store.token = token;
  store.currentUser = safeUser;

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(safeUser));
    }
  } catch {
    // ignore
  }

  store.notify();
}

export function clearSession() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch {
    // ignore
  }
}
