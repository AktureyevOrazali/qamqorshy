'use client'

import { useState } from 'react'

import { getBackendUrl, type VerificationDocument } from '@/lib/api'

type Caregiver = {
  id: string
  fullName: string
  email: string
  verificationDocumentsCount?: number
  caregiver: {
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
    categories: string
  } | null
}

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export default function CaregiverVerifyTable({
  initial,
  verificationDocuments,
}: {
  initial: Caregiver[]
  verificationDocuments: VerificationDocument[]
}) {
  const [rows] = useState(initial)
  const [documents, setDocuments] = useState(verificationDocuments)
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(verificationDocuments.map((doc) => [doc.id, doc.adminComment || '']))
  )
  const [message, setMessage] = useState('')

  const reviewDocument = async (id: string, status: ReviewStatus) => {
    try {
      const res = await fetch(`/api/verification-documents/admin/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminComment: comments[id] || '' }),
      })

      if (!res.ok) {
        setMessage('Review action failed')
        return
      }

      const updated = (await res.json()) as VerificationDocument
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? updated : doc)))
      setMessage(`Document ${status.toLowerCase()} successfully`)
    } catch {
      setMessage('Review action failed')
    }
  }

  const statusColors = {
    UNVERIFIED: 'bg-slate-50 text-slate-500 border-slate-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  const docStatusColors = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return (
    <div className="space-y-8">
      <div className="hidden overflow-auto rounded-2xl border border-[#e7dbcf] bg-white shadow-sm sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf9f6]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Categories</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Documents</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#e7dbcf]/50 transition-colors hover:bg-[#faf9f6]/50">
                <td className="px-6 py-4 font-semibold text-[#2d3147]">{row.fullName}</td>
                <td className="px-6 py-4 text-slate-500">{row.email}</td>
                <td className="px-6 py-4 text-slate-500">{row.caregiver?.categories || '—'}</td>
                <td className="px-6 py-4 text-slate-500">{row.verificationDocumentsCount || 0}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      statusColors[row.caregiver?.verificationStatus || 'UNVERIFIED']
                    }`}
                  >
                    {row.caregiver?.verificationStatus || 'UNVERIFIED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="space-y-3 rounded-2xl border border-[#e7dbcf] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#2d3147]">{row.fullName}</p>
              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
                  statusColors[row.caregiver?.verificationStatus || 'UNVERIFIED']
                }`}
              >
                {row.caregiver?.verificationStatus || 'UNVERIFIED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{row.email}</p>
            {row.caregiver?.categories ? <p className="text-xs text-slate-500">Categories: {row.caregiver.categories}</p> : null}
            <p className="text-xs text-slate-500">Documents: {row.verificationDocumentsCount || 0}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-[#2d3147]">Verification documents</h3>
        {message ? (
          <div className="rounded-2xl border border-[#e7dbcf] bg-[#faf9f6] px-4 py-3 text-sm text-[#8d6241]">
            {message}
          </div>
        ) : null}
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e7dbcf] bg-white px-5 py-6 text-sm text-slate-500">
            No uploaded documents yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-[#e7dbcf] bg-white p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-[#2d3147]">{doc.documentType}</p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      docStatusColors[doc.status]
                    }`}
                  >
                    {doc.status}
                  </span>
                  {doc.adminComment ? <p className="mt-3 text-sm text-slate-600">{doc.adminComment}</p> : null}
                </div>
                <a
                  href={getBackendUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[#8d6241] underline-offset-4 hover:underline"
                >
                  Open file
                </a>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <input
                  type="text"
                  placeholder="Admin comment"
                  value={comments[doc.id] || ''}
                  onChange={(e) => setComments((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                  className="rounded-xl border border-[#e7dbcf] px-4 py-3"
                />
                <button
                  type="button"
                  onClick={() => reviewDocument(doc.id, 'REJECTED')}
                  className="rounded-xl border border-[#d7c7b8] px-4 py-3 font-semibold text-[#8d6241]"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => reviewDocument(doc.id, 'APPROVED')}
                  className="rounded-xl bg-[#8d6241] px-4 py-3 font-semibold text-white"
                >
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
