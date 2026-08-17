/**
 * Session and Cookie Management Helper
 * Manages tab/session-scoped cookies and sessionStorage for authentication tokens and user data.
 * Cookies set without Max-Age / Expires are treated by the browser as Session Cookies
 * that are automatically destroyed when the browser session / tab is closed.
 */

export function setSessionCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return
  // No expires or max-age -> Session cookie (expires when tab/browser is removed)
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`
}

export function getSessionCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const prefix = `${encodeURIComponent(name)}=`
  for (const cookie of cookies) {
    if (cookie.startsWith(prefix)) {
      try {
        return decodeURIComponent(cookie.substring(prefix.length))
      } catch {
        return cookie.substring(prefix.length)
      }
    }
  }
  return null
}

export function removeSessionCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

export interface AuthSessionData {
  token: string | null
  user: any | null
}

export function saveAuthSession(token: string, user: any): void {
  const userJson = JSON.stringify(user)
  // Save as session cookies
  setSessionCookie('access_token', token)
  setSessionCookie('user', userJson)

  // Also save to sessionStorage for tab-level lifecycle
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('access_token', token)
      sessionStorage.setItem('user', userJson)
      // Mirror to localStorage for seamless fallback
      localStorage.setItem('access_token', token)
      localStorage.setItem('user', userJson)
    } catch (e) {
      console.warn('Storage write error:', e)
    }
  }
}

export function getAuthSession(): AuthSessionData {
  if (typeof window === 'undefined') {
    return { token: null, user: null }
  }

  // 1. Check session cookies
  let token = getSessionCookie('access_token')
  let userStr = getSessionCookie('user')

  // 2. Fallback to sessionStorage
  if (!token) {
    try {
      token = sessionStorage.getItem('access_token')
      userStr = sessionStorage.getItem('user')
    } catch {}
  }

  // 3. Fallback to localStorage
  if (!token) {
    try {
      token = localStorage.getItem('access_token')
      userStr = localStorage.getItem('user')
    } catch {}
  }

  let user = null
  if (userStr) {
    try {
      user = JSON.parse(userStr)
    } catch {
      user = null
    }
  }

  return { token: token || null, user }
}

export function clearAuthSession(): void {
  removeSessionCookie('access_token')
  removeSessionCookie('user')

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    } catch {}
  }
}
