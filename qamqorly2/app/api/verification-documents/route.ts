import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/api'

export async function POST(request: Request) {
  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const incoming = await request.formData()
  const payload = new FormData()
  const documentType = incoming.get('documentType')
  const file = incoming.get('file')

  if (!documentType || !file) {
    return NextResponse.json({ detail: 'Document type and file are required' }, { status: 400 })
  }

  payload.append('documentType', documentType)
  payload.append('file', file)

  const res = await fetch(getBackendUrl('/api/verification-documents'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })

  const text = await res.text()

  return new NextResponse(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
    },
  })
}
