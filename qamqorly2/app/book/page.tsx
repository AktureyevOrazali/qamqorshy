import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getDictionary, getLangFromCookies } from '@/lib/i18n'
import BookingForm from '@/components/booking/booking-form'

type ServiceType = 'CHILD' | 'PET' | 'ELDER'

const validTypes: ServiceType[] = ['CHILD', 'PET', 'ELDER']

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; caregiverId?: string }>
}) {
  const user = await requireUser()
  if (user.role !== 'CLIENT') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const type = (params.type || 'CHILD').toUpperCase() as ServiceType
  const defaultType = validTypes.includes(type) ? type : 'CHILD'
  const defaultCaregiverId = params.caregiverId || null

  const lang = await getLangFromCookies()
  const dict = getDictionary(lang)

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:px-10">
      <div className="mt-8">
        <BookingForm defaultType={defaultType} defaultCaregiverId={defaultCaregiverId} dict={dict} lang={lang} />
      </div>
    </section>
  )
}
