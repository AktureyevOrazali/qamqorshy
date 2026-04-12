/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBackendUrl } from '@/lib/api'

const SESSION_COOKIE = 'qamqorshy_session'
const AUTH_REQUEST_TIMEOUT_MS = 4000

export async function getCurrentUser(): Promise<any | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) {
    return null
  }

  try {
    const res = await fetch(getBackendUrl('/api/users/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      return null
    }

    return await res.json()
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      return null
    }

    console.error('Error fetching user from FastAPI:', err)
    return null
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireRole(roles: Array<'CLIENT' | 'CAREGIVER' | 'ADMIN'>) {
  const user = await requireUser()
  if (!roles.includes(user.role)) {
    redirect('/')
  }
  return user
}
