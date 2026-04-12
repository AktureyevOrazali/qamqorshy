'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'

type ProfileProps = {
  role: 'CLIENT' | 'CAREGIVER' | 'ADMIN'
  fullName: string
  phone: string
  address?: string
  about?: string
  bio?: string
  experienceYears?: number
  hourlyRate?: number
  categories?: string
  verificationStatus?: string
  idCardUrl?: string
  diplomaUrl?: string
  dict: any
}

export default function ProfileForm({ 
  lang, 
  dict, 
  ...props 
}: ProfileProps & { lang: 'ru' | 'en' | 'kz' }) {
  const [form, setForm] = useState(props)
  const [message, setMessage] = useState('')
  const updateField = (key: keyof ProfileProps, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setMessage(res.ok ? 'Profile saved' : data.error || 'Save failed')
  }

  const statusColors = {
    UNVERIFIED: 'bg-slate-100 text-slate-600',
    PENDING: 'bg-amber-100 text-amber-700',
    VERIFIED: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <form onSubmit={save} className="space-y-10 rounded-[2.5rem] border border-[#e7dbcf] bg-white p-8 md:p-12 shadow-2xl shadow-slate-200/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-50 pb-8">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-[#2d3147] tracking-tight sm:text-4xl">{dict.nav.profile}</h2>
            <p className="text-slate-400 mt-2 font-light text-sm">Manage your contact information and preferences.</p>
          </div>
          {form.role === 'CAREGIVER' && (
            <div className={`w-fit rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${statusColors[form.verificationStatus as keyof typeof statusColors] || statusColors.UNVERIFIED}`}>
              {dict.common.verificationStatus[form.verificationStatus || 'UNVERIFIED']}
            </div>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <label className="block space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'ФИО' : 'Full Name'}</span>
            <input
              className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light focus:bg-white focus:border-[#d0a144] focus:ring-1 focus:ring-[#d0a144]/10 outline-none transition-all"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
            />
          </label>
          <label className="block space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'Телефон' : 'Phone'}</span>
            <input
              className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light focus:bg-white focus:border-[#d0a144] focus:ring-1 focus:ring-[#d0a144]/10 outline-none transition-all"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </label>
        </div>

        {form.role === 'CLIENT' && (
          <div className="space-y-8">
            <label className="block space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'Адрес' : 'Address'}</span>
              <textarea
                className="min-h-[100px] w-full rounded-[1.8rem] border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light focus:bg-white focus:border-[#d0a144] focus:ring-1 focus:ring-[#d0a144]/10 outline-none transition-all resize-none"
                value={form.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </label>
            <label className="block space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'О семье и потребностях' : 'About Family & Needs'}</span>
              <textarea
                className="min-h-[140px] w-full rounded-[1.8rem] border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light focus:bg-white focus:border-[#d0a144] focus:ring-1 focus:ring-[#d0a144]/10 outline-none transition-all resize-none"
                value={form.about || ''}
                onChange={(e) => updateField('about', e.target.value)}
              />
            </label>
          </div>
        )}

        {form.role === 'CAREGIVER' && (
          <div className="space-y-8">
            <label className="block space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'О себе' : 'Biography'}</span>
              <textarea
                className="min-h-[140px] w-full rounded-[1.8rem] border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light focus:bg-white focus:border-[#d0a144] focus:ring-1 focus:ring-[#d0a144]/10 outline-none transition-all resize-none"
                value={form.bio || ''}
                onChange={(e) => updateField('bio', e.target.value)}
              />
            </label>
            <div className="grid gap-8 md:grid-cols-2">
              <label className="block space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'Опыт (лет)' : 'Experience (years)'}</span>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light focus:bg-white focus:border-[#d0a144] focus:ring-1 focus:ring-[#d0a144]/10 outline-none transition-all"
                  value={form.experienceYears || 0}
                  onChange={(e) => updateField('experienceYears', Number(e.target.value))}
                />
              </label>
              <label className="block space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'Ставка (₸/час)' : 'Hourly Rate (₸/h)'}</span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light focus:bg-white focus:border-[#d0a144] focus:ring-1 focus:ring-[#d0a144]/10 outline-none transition-all"
                  value={form.hourlyRate || 0}
                  onChange={(e) => updateField('hourlyRate', Number(e.target.value))}
                />
              </label>
            </div>
            
            <div className="rounded-[2rem] border border-[#e7dbcf] bg-[#faf9f6]/50 p-8 space-y-6 mt-6">
              <h3 className="font-serif text-xl font-semibold text-[#8d6241] flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-[#8d6241]/10 flex items-center justify-center text-sm">🛡️</span>
                {dict.profile.verification}
              </h3>
              <div className="grid gap-6">
                <label className="block space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{dict.profile.uploadID}</span>
                  <input
                    className="w-full rounded-2xl border border-slate-100 bg-white px-6 py-4 text-sm font-light focus:border-[#d0a144] outline-none transition-all shadow-sm"
                    value={form.idCardUrl || ''}
                    onChange={(e) => updateField('idCardUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{dict.profile.uploadDiploma}</span>
                  <input
                    className="w-full rounded-2xl border border-slate-100 bg-white px-6 py-4 text-sm font-light focus:border-[#d0a144] outline-none transition-all shadow-sm"
                    value={form.diplomaUrl || ''}
                    onChange={(e) => updateField('diplomaUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-light italic leading-loose">
                {lang === 'ru' 
                  ? 'Для обеспечения безопасности, все документы проверяются администратором в течение 24 часов.' 
                  : 'For safety assurance, all documents are verified by an administrator within 24 hours.'}
              </p>
            </div>
          </div>
        )}

        {message && <p className="text-sm text-center py-4 px-6 rounded-2xl bg-[#8d6241]/5 font-bold text-[#8d6241] border border-[#8d6241]/10 animate-pulse">{message}</p>}
        
        <div className="pt-6">
          <button 
            type="submit" 
            className="w-full rounded-2xl bg-[#8d6241] py-5 font-black text-white text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#8d6241]/30 hover:bg-[#724f35] hover:-translate-y-0.5 transition-all"
          >
            {form.role === 'CLIENT' ? (lang === 'ru' ? 'Сохранить изменения' : 'Save Changes') : (lang === 'ru' ? 'Отправить на проверку' : 'Submit for Verification')}
          </button>
        </div>
      </form>
    </div>
  )
}
