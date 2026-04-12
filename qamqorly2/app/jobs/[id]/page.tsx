import type { ReactNode } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { NegotiatePricePanel } from '@/components/jobs/negotiate-price-panel'
import { requireRole } from '@/lib/auth'
import { getBackendUrl } from '@/lib/api'
import { getLangFromCookies } from '@/lib/i18n'

function parseTasks(tasks: unknown): string[] {
  if (Array.isArray(tasks)) {
    return tasks.map((task) => String(task).trim()).filter(Boolean)
  }

  if (typeof tasks === 'string') {
    try {
      const parsed = JSON.parse(tasks)
      if (Array.isArray(parsed)) {
        return parsed.map((task) => String(task).trim()).filter(Boolean)
      }
    } catch {
      // fall through to string splitting
    }

    return tasks
      .split(',')
      .map((task) => task.replace(/[\[\]"]+/g, '').trim())
      .filter(Boolean)
  }

  return []
}

function formatTask(task: string) {
  return task
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
}

function getServiceLabel(serviceType: string) {
  if (serviceType === 'CHILD') return 'Child care'
  if (serviceType === 'ELDER') return 'Elder care'
  return 'Pet care'
}

function DetailCard({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex min-h-[168px] h-full flex-col rounded-[1.8rem] border border-[#eee2d5] bg-white p-6 shadow-sm ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <div className="mt-4 flex-1 text-[#2d3147]">{children}</div>
    </div>
  )
}

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRole(['CAREGIVER', 'ADMIN'])
  const lang = await getLangFromCookies()
  const { id } = await params

  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  const res = await fetch(getBackendUrl(`/api/bookings/${id}`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    if (res.status === 404) {
      notFound()
    }
    throw new Error('Failed to fetch job details')
  }

  const booking = await res.json()

  if (booking.caregiverId && booking.caregiverId !== user.id && user.role !== 'ADMIN') {
    notFound()
  }

  const tx = {
    ru: {
      back: 'Назад к заказам',
      details: 'Детали заказа',
      helper: 'Проверьте задачу и при необходимости измените цену шагом 1000 KZT.',
      client: 'Клиент',
      date: 'Дата и время',
      duration: 'Длительность',
      tasks: 'Задачи',
      noTasks: 'Клиент пока не указал задачи.',
      notes: 'Комментарий клиента',
      noNotes: 'Комментариев пока нет.',
      address: 'Адрес',
      noAddress: 'Адрес не указан',
      payout: 'Текущая цена',
      hours: 'ч',
      accept: 'Принять заказ',
      counter: 'Предложить свою цену',
      summary: 'Кратко',
    },
    en: {
      back: 'Back to jobs',
      details: 'Job Details',
      helper: 'Review the request and change the price only when you need a different payout.',
      client: 'Client',
      date: 'Date and time',
      duration: 'Duration',
      tasks: 'Tasks',
      noTasks: 'The client has not listed tasks yet.',
      notes: 'Client notes',
      noNotes: 'No extra notes yet.',
      address: 'Address',
      noAddress: 'Address not specified',
      payout: 'Current payout',
      hours: 'h',
      accept: 'Accept order',
      counter: 'Send counter offer',
      summary: 'Summary',
    },
  }[lang === 'kz' ? 'ru' : lang]

  const scheduledAt = new Date(booking.scheduledAt).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  const tasks = parseTasks(booking.tasks)
  const serviceLabel = getServiceLabel(booking.serviceType)

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-14 pt-24 md:px-8 md:pb-14 md:pt-28">
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eadbca] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 transition-colors hover:border-[#8d6241] hover:text-[#8d6241]"
      >
        {'<-'} {tx.back}
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <section className="rounded-[2.2rem] border border-[#eadbca] bg-[#fffdfa] p-6 shadow-[0_20px_60px_rgba(141,98,65,0.06)] md:p-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#f5ece1] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8d6241]">
              {serviceLabel}
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#2d3147] md:text-6xl">
              {tx.details}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{tx.helper}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 auto-rows-fr">
            <DetailCard label={tx.date}>
              <p className="text-xl font-semibold leading-8">{scheduledAt}</p>
            </DetailCard>

            <DetailCard label={tx.duration}>
              <p className="text-3xl font-serif font-semibold">
                {booking.duration} {tx.hours}
              </p>
            </DetailCard>

            <DetailCard label={tx.tasks}>
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-400">{tx.noTasks}</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {tasks.map((task) => (
                    <span
                      key={task}
                      className="rounded-full border border-[#e7dbcf] bg-[#fcfaf7] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#556076]"
                    >
                      {formatTask(task)}
                    </span>
                  ))}
                </div>
              )}
            </DetailCard>

            <DetailCard label={tx.address}>
              <p className="text-xl font-semibold leading-8 text-[#2d3147]">
                {booking.address || booking.client.clientProfile?.address || tx.noAddress}
              </p>
            </DetailCard>

            <div className="md:col-span-2">
              <DetailCard label={tx.notes} className="min-h-[144px]">
                <p className="text-[15px] leading-8 text-slate-600">{booking.notes || tx.noNotes}</p>
              </DetailCard>
            </div>
          </div>
        </section>

        <aside className="xl:sticky xl:top-10">
          <div className="rounded-[2.2rem] border border-[#eadbca] bg-white p-6 shadow-[0_20px_60px_rgba(141,98,65,0.08)]">
            <div className="rounded-[1.8rem] border border-[#f0e3d6] bg-[#fcfaf7] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2ebe2] font-serif text-lg text-[#8d6241]">
                  {booking.client.fullName?.[0] || 'C'}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{tx.client}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#2d3147]">{booking.client.fullName}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-white px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{tx.payout}</p>
                <p className="mt-3 font-serif text-5xl font-semibold leading-none text-[#8d6241]">
                  {Number(booking.price || 0).toLocaleString()}
                </p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">KZT</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.8rem] border border-[#eee2d5] bg-[#fcfcfb] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">{tx.summary}</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>{tx.duration}</span>
                  <span className="font-semibold text-[#2d3147]">
                    {booking.duration} {tx.hours}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{tx.tasks}</span>
                  <span className="font-semibold text-[#2d3147]">{tasks.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <NegotiatePricePanel booking={booking} tx={tx} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}



