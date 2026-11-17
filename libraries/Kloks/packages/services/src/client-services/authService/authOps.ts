import { UserAccount, UserRole } from '@kloks/state-graph';
import { verifyPassword } from './adminAuthOps';

export { verifyPassword, loginAdmin } from './adminAuthOps';

export async function loginUser(
  store: any,
  email: string,
  password: string
): Promise<{ success: boolean; user?: Omit<UserAccount, 'passwordHash'>; token?: string; error?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail) {
    return { success: false, error: 'Email address or username is required.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Password is required to sign in.' };
  }

  let serverError: string | null = null;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
    });
    const data = await res.json();
    if (data.success && data.user && data.token) {
      store.setSession(data.user, data.token);
      const emailKey = (data.user.email || cleanEmail).toLowerCase();
      const existingLocal = store.users.get(emailKey);
      store.users.set(emailKey, {
        ...(existingLocal || data.user),
        ...data.user,
        passwordHash: cleanPass,
      });
      store.persistDatabase();
      return { success: true, user: data.user, token: data.token };
    } else if (data.error) {
      serverError = data.error;
    }
  } catch {
    // fallback
  }

  const existing = store.users.get(cleanEmail) || Array.from(store.users.values()).find((u: any) => (u.username || '').toLowerCase() === cleanEmail);
  if (existing) {
    if (verifyPassword(password, existing.passwordHash) || verifyPassword(cleanPass, existing.passwordHash)) {
      const { passwordHash: _, ...safeUser } = existing;
      safeUser.lastLoginAt = new Date().toISOString();
      store.setSession(safeUser);
      return { success: true, user: safeUser, token: store.token! };
    }
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  }

  if (serverError) {
    return { success: false, error: serverError };
  }

  return { success: false, error: 'No account found with this email or username. Please register a new account.' };
}

export async function register(
  store: any,
  params: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }
): Promise<{ success: boolean; user?: Omit<UserAccount, 'passwordHash'>; token?: string; error?: string }> {
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const cleanPass = (params.password || '').trim();

  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPass,
        name: params.name,
        role: params.role,
      }),
    });
    const data = await res.json();
    if (data.success && data.user && data.token) {
      store.setSession(data.user, data.token);
      store.users.set(cleanEmail, { ...data.user, passwordHash: cleanPass });
      store.persistDatabase();
      return { success: true, user: data.user, token: data.token };
    } else if (data.error) {
      return { success: false, error: data.error };
    }
  } catch {
    // fallback
  }

  if (store.users.has(cleanEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now()}`;
  const role: UserRole = params.role || 'user';
  const glyph = role === 'admin' ? '🛡️' : role === 'pro' ? '⭐' : '👤';

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    username,
    name: params.name.trim() || username,
    role,
    avatarGlyph: glyph,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    passwordHash: params.password,
    emailVerified: true,
    trustLevel: role === 'admin' ? 'T4_PRIVILEGED' : 'T1_EMAIL_VERIFIED',
    status: 'ACTIVE',
    workspaces: [],
    storage_connections: [],
  };

  store.users.set(cleanEmail, newUser);
  store.persistDatabase();
  store.setSession(newUser);

  return {
    success: true,
    user: store.currentUser!,
    token: store.token!,
  };
}
