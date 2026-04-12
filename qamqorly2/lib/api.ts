export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'

export function getBackendUrl(path: string) {
  return `${BACKEND_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
