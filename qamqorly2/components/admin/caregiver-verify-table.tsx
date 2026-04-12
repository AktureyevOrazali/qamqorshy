'use client'

import { useState } from 'react'

type Caregiver = {
  id: string
  fullName: string
  email: string
  caregiver: {
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
    categories: string
  } | null
}

export default function CaregiverVerifyTable({ initial }: { initial: Caregiver[] }) {
  const [rows, setRows] = useState(initial)

  const updateStatus = async (
    caregiverUserId: string,
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
  ) => {
    const res = await fetch(`/api/caregivers/admin/${caregiverUserId}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: verificationStatus }),
    })
    if (!res.ok) {
      return
    }
    setRows((prev) =>
      prev.map((item) =>
        item.id === caregiverUserId
          ? { ...item, caregiver: { ...(item.caregiver || { categories: '' }), verificationStatus } }
          : item
      )
    )
  }

  const statusColors = {
    UNVERIFIED: 'bg-slate-50 text-slate-500 border-slate-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-auto rounded-2xl border border-[#e7dbcf] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf9f6]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#e7dbcf]/50 hover:bg-[#faf9f6]/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-[#2d3147]">{row.fullName}</td>
                <td className="px-6 py-4 text-slate-500">{row.email}</td>
                <td className="px-6 py-4 text-slate-500">{row.caregiver?.categories || '—'}</td>
                <td className="px-6 py-4">
                  <select
                    value={row.caregiver?.verificationStatus || 'UNVERIFIED'}
                    onChange={(e) =>
                      updateStatus(
                        row.id,
                        e.target.value as 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
                      )
                    }
                    className="q-select py-2 text-xs font-bold"
                  >
                    <option value="UNVERIFIED">UNVERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="VERIFIED">VERIFIED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-[#e7dbcf] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#2d3147]">{row.fullName}</p>
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${statusColors[row.caregiver?.verificationStatus || 'UNVERIFIED']}`}>
                {row.caregiver?.verificationStatus || 'UNVERIFIED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{row.email}</p>
            {row.caregiver?.categories && (
              <p className="text-xs text-slate-500">Categories: {row.caregiver.categories}</p>
            )}
            <select
              value={row.caregiver?.verificationStatus || 'UNVERIFIED'}
              onChange={(e) =>
                updateStatus(
                  row.id,
                  e.target.value as 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
                )
              }
              className="q-select py-2 text-xs font-bold"
            >
              <option value="UNVERIFIED">UNVERIFIED</option>
              <option value="PENDING">PENDING</option>
              <option value="VERIFIED">VERIFIED</option>
            </select>
          </div>
        ))}
      </div>
    </>
  )
}
