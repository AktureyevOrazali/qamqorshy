export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'

export function getBackendUrl(path: string) {
  return `${BACKEND_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export type VerificationDocument = {
  id: string
  caregiverProfileId: string
  documentType: 'ID_CARD' | 'DIPLOMA' | 'CERTIFICATE'
  fileUrl: string
  originalFileName?: string | null
  mimeType?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminComment?: string | null
  reviewedByUserId?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
}

export async function getMyVerificationDocuments(token: string) {
  const res = await fetch(getBackendUrl('/api/verification-documents'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch verification documents')
  }

  return res.json() as Promise<{ documents: VerificationDocument[] }>
}

export async function getAdminVerificationDocuments(token: string) {
  const res = await fetch(getBackendUrl('/api/verification-documents/admin'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch admin verification documents')
  }

  return res.json() as Promise<{ documents: VerificationDocument[] }>
}

export async function reviewVerificationDocument(
  token: string,
  id: string,
  payload: { status: 'APPROVED' | 'REJECTED' | 'PENDING'; adminComment?: string }
) {
  const res = await fetch(getBackendUrl(`/api/verification-documents/admin/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error('Failed to review verification document')
  }

  return res.json() as Promise<VerificationDocument>
}
