import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/api'

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: Context) {
  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.text()

  const res = await fetch(getBackendUrl(`/api/verification-documents/admin/${id}`), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  const text = await res.text()

  return new NextResponse(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
    },
  })
}
