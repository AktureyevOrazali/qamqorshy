'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from 'react'

import { getBackendUrl, type VerificationDocument } from '@/lib/api'

type ProfileProps = {
  lang: 'ru' | 'en' | 'kz'
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
  verificationDocuments: VerificationDocument[]
  dict: any
}

type UploadType = 'ID_CARD' | 'DIPLOMA' | 'CERTIFICATE'

export default function ProfileForm({
  dict,
  lang,
  verificationDocuments,
  ...props
}: ProfileProps) {
  const [form, setForm] = useState(props)
  const [message, setMessage] = useState('')
  const [documents, setDocuments] = useState<VerificationDocument[]>(verificationDocuments)
  const [documentType, setDocumentType] = useState<UploadType>('ID_CARD')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const updateField = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const statusColors = {
    UNVERIFIED: 'bg-slate-100 text-slate-600',
    PENDING: 'bg-amber-100 text-amber-700',
    VERIFIED: 'bg-emerald-100 text-emerald-700',
  }

  const documentTypeLabel = useMemo(
    () => ({
      ID_CARD: lang === 'ru' ? 'ID карта' : lang === 'kz' ? 'Жеке куәлік' : 'ID card',
      DIPLOMA: lang === 'ru' ? 'Диплом' : lang === 'kz' ? 'Диплом' : 'Diploma',
      CERTIFICATE: lang === 'ru' ? 'Сертификат' : lang === 'kz' ? 'Сертификат' : 'Certificate',
    }),
    [lang]
  )

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

  const uploadDocument = async () => {
    if (!selectedFile) {
      setMessage('Choose a file before uploading')
      return
    }

    const payload = new FormData()
    payload.append('documentType', documentType)
    payload.append('file', selectedFile)

    setUploading(true)
    setMessage('')

    try {
      const res = await fetch('/api/verification-documents', {
        method: 'POST',
        body: payload,
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.detail || 'Failed to upload document')
        return
      }

      setDocuments((prev) => [data, ...prev])
      setForm((prev) => ({ ...prev, verificationStatus: 'PENDING' }))
      setSelectedFile(null)
      setMessage('Document uploaded and sent for review')
    } catch {
      setMessage('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <form onSubmit={save} className="space-y-10 rounded-[2.5rem] border border-[#e7dbcf] bg-white p-8 shadow-2xl shadow-slate-200/50 md:p-12">
        <div className="flex flex-col gap-4 border-b border-slate-50 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#2d3147] sm:text-4xl">{dict.nav.profile}</h2>
            <p className="mt-2 text-sm font-light text-slate-400">Manage your contact information and preferences.</p>
          </div>
          {form.role === 'CAREGIVER' && (
            <div
              className={`w-fit rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                statusColors[form.verificationStatus as keyof typeof statusColors] || statusColors.UNVERIFIED
              }`}
            >
              {(dict.common?.verificationStatus?.[form.verificationStatus || 'UNVERIFIED'] as string) ||
                form.verificationStatus ||
                'UNVERIFIED'}
            </div>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <label className="block space-y-2.5">
            <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'ru' ? 'ФИО' : 'Full Name'}</span>
            <input
              className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light outline-none transition-all focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
            />
          </label>
          <label className="block space-y-2.5">
            <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'ru' ? 'Телефон' : 'Phone'}</span>
            <input
              className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light outline-none transition-all focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </label>
        </div>

        {form.role === 'CLIENT' && (
          <div className="space-y-8">
            <label className="block space-y-2.5">
              <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'ru' ? 'Адрес' : 'Address'}</span>
              <textarea
                className="min-h-[100px] w-full resize-none rounded-[1.8rem] border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light outline-none transition-all focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10"
                value={form.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </label>
            <label className="block space-y-2.5">
              <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {lang === 'ru' ? 'О семье и потребностях' : 'About Family & Needs'}
              </span>
              <textarea
                className="min-h-[140px] w-full resize-none rounded-[1.8rem] border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light outline-none transition-all focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10"
                value={form.about || ''}
                onChange={(e) => updateField('about', e.target.value)}
              />
            </label>
          </div>
        )}

        {form.role === 'CAREGIVER' && (
          <div className="space-y-8">
            <label className="block space-y-2.5">
              <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{lang === 'ru' ? 'О себе' : 'Biography'}</span>
              <textarea
                className="min-h-[140px] w-full resize-none rounded-[1.8rem] border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light outline-none transition-all focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10"
                value={form.bio || ''}
                onChange={(e) => updateField('bio', e.target.value)}
              />
            </label>

            <div className="grid gap-8 md:grid-cols-2">
              <label className="block space-y-2.5">
                <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {lang === 'ru' ? 'Опыт (лет)' : 'Experience (years)'}
                </span>
                <input
                  type="number"
                  className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light outline-none transition-all focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10"
                  value={form.experienceYears || 0}
                  onChange={(e) => updateField('experienceYears', Number(e.target.value))}
                />
              </label>
              <label className="block space-y-2.5">
                <span className="pl-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {lang === 'ru' ? 'Ставка (₸/час)' : 'Hourly Rate (₸/h)'}
                </span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  className="w-full rounded-2xl border border-slate-100 bg-[#faf9f6]/50 px-6 py-4 text-base font-light outline-none transition-all focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10"
                  value={form.hourlyRate || 0}
                  onChange={(e) => updateField('hourlyRate', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="rounded-[2rem] border border-[#e7dbcf] bg-[#faf9f6]/50 p-8">
              <div className="flex flex-col gap-2 border-b border-[#eadbcf] pb-5">
                <h3 className="font-serif text-xl font-semibold text-[#8d6241]">
                  {lang === 'ru' ? 'Проверка документов' : lang === 'kz' ? 'Құжаттарды тексеру' : 'Verification documents'}
                </h3>
                <p className="text-sm text-slate-500">
                  {lang === 'ru'
                    ? 'Загрузите документы, а администратор проверит их вручную.'
                    : lang === 'kz'
                      ? 'Құжаттарды жүктеңіз, оларды әкімші қолмен тексереді.'
                      : 'Upload your documents and an administrator will review them manually.'}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr_auto]">
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as UploadType)}
                  className="rounded-xl border border-[#e7dbcf] px-4 py-3"
                >
                  <option value="ID_CARD">{documentTypeLabel.ID_CARD}</option>
                  <option value="DIPLOMA">{documentTypeLabel.DIPLOMA}</option>
                  <option value="CERTIFICATE">{documentTypeLabel.CERTIFICATE}</option>
                </select>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="rounded-xl border border-[#e7dbcf] px-4 py-3"
                />
                <button
                  type="button"
                  onClick={uploadDocument}
                  disabled={uploading}
                  className="rounded-xl bg-[#8d6241] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? 'Uploading...' : lang === 'ru' ? 'Загрузить' : 'Upload'}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {documents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#e7dbcf] px-5 py-6 text-sm text-slate-500">
                    {lang === 'ru'
                      ? 'Документы еще не загружены.'
                      : lang === 'kz'
                        ? 'Құжаттар әлі жүктелмеген.'
                        : 'No documents uploaded yet.'}
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="rounded-2xl border border-[#eadbcf] bg-white p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold text-[#2d3147]">{documentTypeLabel[doc.documentType]}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{doc.status}</p>
                          {doc.adminComment ? <p className="mt-2 text-sm text-rose-700">{doc.adminComment}</p> : null}
                        </div>
                        <a
                          href={getBackendUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#8d6241] underline-offset-4 hover:underline"
                        >
                          {lang === 'ru' ? 'Открыть файл' : 'Open file'}
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {message && (
          <p className="rounded-2xl border border-[#8d6241]/10 bg-[#8d6241]/5 px-6 py-4 text-center text-sm font-bold text-[#8d6241]">
            {message}
          </p>
        )}

        <div className="pt-6">
          <button
            type="submit"
            className="w-full rounded-2xl bg-[#8d6241] py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-[#8d6241]/30 transition-all hover:-translate-y-0.5 hover:bg-[#724f35]"
          >
            {lang === 'ru' ? 'Сохранить изменения' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
