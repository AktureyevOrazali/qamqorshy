/* eslint-disable @typescript-eslint/no-explicit-any */
import RouterLink from '@/shared/ui/router-link'

type NavLabels = {
  home: string
  product: string
  pricing: string
  contact: string
  specialists: string
  clients: string
  messages: string
  quality: string
  jobs: string
}

const NavBar = ({ session, labels }: { session: any; labels: NavLabels }) => {
  const isCaregiver = session?.role === 'CAREGIVER'
  const isAuthed = Boolean(session)

  return (
    <nav className="hidden items-center gap-5 md:flex">
      {!isCaregiver && (
        <>
          <RouterLink text={labels.product} link="/#services" />
          <RouterLink text={labels.pricing} link="/#pricing" />
          <RouterLink text={labels.specialists} link="/caregivers" />
        </>
      )}

      {isCaregiver && <RouterLink text={labels.jobs} link="/jobs" />}

      {isAuthed && (
        <>
          <RouterLink text={labels.messages} link="/messages" />
          <RouterLink text={labels.quality} link="/quality" />
        </>
      )}
    </nav>
  )
}

export default NavBar
