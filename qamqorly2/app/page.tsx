import {
  ArrowRight,
  Baby,
  CalendarClock,
  Check,
  Clock3,
  Heart,
  HeartPulse,
  Mail,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'

import { getCurrentUser } from '@/lib/auth'
import { getDictionary, getLangFromCookies, type Lang } from '@/lib/i18n'
import ServicesShowcase from '@/components/home/services-showcase'
import PrimaryButton from '@/shared/ui/buttons/primary-button'

type CareType = 'CHILD' | 'PET' | 'ELDER'

type ServiceCard = {
  type: CareType
  title: string
  summary: string
  rate: string
  bullets: string[]
}

type FocusCard = {
  title: string
  line: string
}

type FlowStep = {
  step: string
  title: string
  line: string
}

type LandingCopy = {
  heroEyebrow: string
  heroTitle: string
  heroLine: string
  primaryCta: string
  secondaryCta: string
  heroSignals: string[]
  heroPanelTitle: string
  heroPanelLine: string
  heroPanelCards: FocusCard[]
  servicesEyebrow: string
  servicesTitle: string
  servicesLine: string
  serviceCards: ServiceCard[]
  flowEyebrow: string
  flowTitle: string
  flowLine: string
  flowSteps: FlowStep[]
  pricingEyebrow: string
  pricingTitle: string
  pricingLine: string
  pricingNote: string
  trustEyebrow: string
  trustTitle: string
  trustLine: string
  trustPoints: string[]
  finalTitle: string
  finalLine: string
  finalSupport: string
  footerLine: string
}

const englishCopy: LandingCopy = {
  heroEyebrow: 'Caregiving platform',
  heroTitle: 'Calm caregiving, arranged in one clear flow.',
  heroLine:
    'Qamqorshy brings family care, pet care, and elder support into one booking path that feels steady, warm, and easy to trust.',
  primaryCta: 'Start booking',
  secondaryCta: 'See care options',
  heroSignals: ['Verified caregivers', 'Transparent starting rates', 'Support when the plan shifts'],
  heroPanelTitle: 'Care that fits real homes',
  heroPanelLine: 'Support should feel dependable from the first request to the moment someone arrives at the door.',
  heroPanelCards: [
    { title: 'Family rhythm', line: 'Daily help that fits the household instead of interrupting it.' },
    { title: 'Clear matching', line: 'Choose the care track quickly and move forward with confidence.' },
    { title: 'Flexible timing', line: 'Book routine support or one-off visits without re-learning the flow.' },
    { title: 'Human backup', line: 'Keep support close if details change before the visit starts.' },
  ],
  servicesEyebrow: 'Care modes',
  servicesTitle: 'Choose the kind of care your home needs.',
  servicesLine:
    'Child care, pet care, and elderly support arranged in one calm booking flow.',
  serviceCards: [
    {
      type: 'CHILD',
      title: 'Child Care',
      summary: 'Structured help for school days, evenings, and routines that need a calm second pair of hands.',
      rate: 'from 7,000 KZT / hour',
      bullets: ['School pickup and handoff', 'Homework rhythm and meals', 'Evening routines with updates'],
    },
    {
      type: 'PET',
      title: 'Pet Care',
      summary: 'Consistent care for walks, feeding, and visits when the day gets too full for pet logistics.',
      rate: 'from 5,000 KZT / hour',
      bullets: ['Walks and feeding windows', 'Repeat visits on one flow', 'Comfort-first home check-ins'],
    },
    {
      type: 'ELDER',
      title: 'Elderly Care',
      summary: 'Respectful support for companionship, medication routines, and daily stability at home.',
      rate: 'from 8,000 KZT / hour',
      bullets: ['Daily wellbeing support', 'Companionship and presence', 'Home visits with clear timing'],
    },
  ],
  flowEyebrow: 'Booking flow',
  flowTitle: 'Book support in four calm steps.',
  flowLine:
    'Choose the care type, set the visit, review the request, and send it in minutes.',
  flowSteps: [
    { step: '01', title: 'Choose the care mode', line: 'Start with the household need, not with a maze of options.' },
    { step: '02', title: 'Set the visit shape', line: 'Add timing, notes, and the support rhythm in one place.' },
    { step: '03', title: 'Compare the starting rate', line: 'Review the category price only when the care choice is already clear.' },
    { step: '04', title: 'Send the request', line: 'Confirm the visit with a calm CTA row that stays aligned and predictable.' },
  ],
  pricingEyebrow: 'Pricing',
  pricingTitle: 'Starting rates for every care type.',
  pricingLine:
    'Compare the base rate for child care, pet care, and elderly support.',
  pricingNote: 'Final pricing depends on timing, visit length, and the kind of support needed.',
  trustEyebrow: 'Trust and action',
  trustTitle: 'Care should feel reliable before the visit begins.',
  trustLine:
    'Families need confidence in who is coming, how the visit is arranged, and where to turn if the plan changes.',
  trustPoints: ['Verified caregivers before booking', 'Clear review before the request is sent', 'Support channel ready if plans change'],
  finalTitle: 'Find the right support for your home.',
  finalLine: 'From daily routines to one-off visits, Qamqorshy helps families arrange care with clarity and warmth.',
  finalSupport: 'Need a quick answer? support@qamqorshy.kz',
  footerLine: 'Qamqorshy caregiving platform',
}

const copyByLang: Record<Lang, LandingCopy> = {
  ru: englishCopy,
  en: englishCopy,
  kz: englishCopy,
}

const serviceIcons = {
  CHILD: Baby,
  PET: PawPrint,
  ELDER: HeartPulse,
} as const

const sectionClass = 'scroll-mt-24 py-4 md:flex md:min-h-[calc(100svh-5rem)] md:items-center md:py-3'
const shellClass = 'relative w-full overflow-hidden rounded-[1.8rem] border border-[#ead9ca] bg-[linear-gradient(180deg,rgba(255,252,248,0.98),rgba(245,237,230,0.96))] p-3 shadow-[0_22px_60px_rgba(105,79,55,0.08)] sm:rounded-[2.35rem] sm:p-5 md:p-6'
const innerCardClass =
  'flex h-full flex-col rounded-[1.45rem] border border-white/85 bg-white/72 p-4 shadow-[0_14px_32px_rgba(96,72,50,0.05)] backdrop-blur-sm'

export default async function Page() {
  const session = await getCurrentUser()
  const lang = await getLangFromCookies()
  const dict = getDictionary(lang)
  const home = dict.home
  const isCaregiver = session?.role === 'CAREGIVER'
  const copy = copyByLang[lang]

  const primaryCtaHref = session ? (isCaregiver ? '/jobs' : '/book') : '/login'
  const primaryCtaText = session ? (isCaregiver ? home.ctaSearch : home.ctaOrder) : copy.primaryCta

  return (
    <div className="pb-6 pt-20 text-[#2d3147] md:pb-10 md:pt-24">
      <div className="mx-auto flex max-w-[1240px] flex-col px-4 sm:px-6 md:px-8">
        <section data-snap="page" className={sectionClass}>
          <div className={shellClass}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(208,161,68,0.18),transparent_55%)]" />
            <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(141,98,65,0.1),transparent_70%)]" />
            <div className="relative grid gap-5 md:gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] xl:items-stretch">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dccab8] bg-white/88 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8d6241]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.heroEyebrow}
                  </div>
                  <h1 className="mt-6 max-w-[12ch] font-serif text-[2.5rem] font-semibold leading-[0.92] tracking-[-0.06em] text-[#2d3147] sm:text-[4rem] xl:text-[5.35rem]">
                    {isCaregiver ? home.heroCaregiverTitle : copy.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-[39rem] text-base leading-7 text-slate-600 sm:text-lg">
                    {isCaregiver ? home.heroCaregiverSubtitle : copy.heroLine}
                  </p>
                </div>

                <div className="mt-8 space-y-5">
                  <div className="grid gap-3 sm:max-w-[31rem] sm:grid-cols-2">
                    <PrimaryButton
                      href={primaryCtaHref}
                      text={primaryCtaText}
                      className="w-full justify-center px-6 py-3.5 text-sm font-semibold shadow-lg shadow-[#8d6241]/15"
                    />
                    <PrimaryButton
                      href="/#services"
                      text={copy.secondaryCta}
                      variant="outlined"
                      className="w-full justify-center px-6 py-3.5 text-sm font-semibold"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {copy.heroSignals.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-[#eadbcf] bg-white/80 px-4 py-2 text-sm text-slate-600"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f4ebe1] text-[#8d6241]">
                          <Check className="h-3 w-3" />
                        </span>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <aside className={innerCardClass}>
                <div className="flex items-start justify-between gap-4 border-b border-[#efe4d8] pb-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8d6241]">At a glance</p>
                    <h2 className="mt-2 font-serif text-[1.6rem] font-semibold tracking-[-0.04em] text-[#2d3147]">
                      {copy.heroPanelTitle}
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4ebe1] text-[#8d6241]">
                    <Heart className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-600">{copy.heroPanelLine}</p>
                <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2">
                  {copy.heroPanelCards.map((item, index) => {
                    const icons = [CalendarClock, ShieldCheck, Clock3, MessageSquare]
                    const Icon = icons[index] ?? ShieldCheck
                    return (
                      <article key={item.title} className="flex h-full flex-col rounded-[1.4rem] border border-[#f1e7dc] bg-[#fffdfa] p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4ebe1] text-[#8d6241]">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <h3 className="mt-4 font-serif text-[1.25rem] font-semibold tracking-[-0.03em] text-[#2d3147]">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.line}</p>
                      </article>
                    )
                  })}
                </div>
              </aside>
            </div>
          </div>
        </section>

                <section id="services" data-snap="page" className={sectionClass}>
          <div className={shellClass}>
            <ServicesShowcase
              eyebrow={copy.servicesEyebrow}
              title={copy.servicesTitle}
              line={copy.servicesLine}
              serviceCards={copy.serviceCards}
              ctaText={primaryCtaText}
              ctaHref={primaryCtaHref}
            />
          </div>
        </section>
<section id="how-it-works" data-snap="page" className={sectionClass}>
          <div className={shellClass}>
            <div className="flex h-full flex-col">
              <div className="max-w-3xl border-b border-[#ecdfd2] pb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6241]">{copy.flowEyebrow}</p>
                <h2 className="mt-3 font-serif text-[1.85rem] font-semibold tracking-[-0.05em] text-[#2d3147] sm:text-[2.4rem]">
                  {copy.flowTitle}
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-600">{copy.flowLine}</p>
              </div>

              <div className="mt-5 grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
                {copy.flowSteps.map((step) => (
                  <article key={step.step} className={innerCardClass}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4ebe1] text-xs font-semibold text-[#8d6241]">
                      {step.step}
                    </div>
                    <h3 className="mt-5 font-serif text-[1.3rem] font-semibold tracking-[-0.03em] text-[#2d3147]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{step.line}</p>
                    <div className="mt-auto pt-6 text-sm font-medium text-[#8d6241]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#eadbcf] bg-[#fffdfa] px-3 py-1.5">
                        <ArrowRight className="h-4 w-4" />
                        Continue
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {!isCaregiver && (
          <section id="pricing" data-snap="page" className={sectionClass}>
            <div className={shellClass}>
              <div className="flex h-full flex-col">
                <div className="flex flex-col gap-4 border-b border-[#ecdfd2] pb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6241]">{copy.pricingEyebrow}</p>
                    <h2 className="mt-3 font-serif text-[1.85rem] font-semibold tracking-[-0.05em] text-[#2d3147] sm:text-[2.4rem]">
                      {copy.pricingTitle}
                    </h2>
                  </div>
                  <p className="max-w-md text-sm leading-6 text-slate-600">{copy.pricingLine}</p>
                </div>

                <div className="mt-5 grid auto-rows-fr gap-3 lg:grid-cols-3">
                  {copy.serviceCards.map((item) => {
                    const Icon = serviceIcons[item.type]
                    return (
                      <article key={item.type} className={innerCardClass}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d6241]">{item.title}</p>
                            <p className="mt-4 font-serif text-[1.7rem] font-semibold tracking-[-0.05em] text-[#2d3147] sm:text-[1.9rem]">{item.rate}</p>
                          </div>
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4ebe1] text-[#8d6241]">
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                        <div className="mt-6 space-y-3">
                          {item.bullets.map((bullet) => (
                            <div key={bullet} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#8d6241]" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="mt-6 grid gap-3 rounded-[1.85rem] border border-white/85 bg-white/76 p-5 shadow-[0_18px_42px_rgba(96,72,50,0.05)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                  <div className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4ebe1] text-[#8d6241]">
                      <Stethoscope className="h-4.5 w-4.5" />
                    </span>
                    <p>{copy.pricingNote}</p>
                  </div>
                  <PrimaryButton
                    href={primaryCtaHref}
                    text={primaryCtaText}
                    className="w-full justify-center px-6 py-3.5 text-sm font-semibold sm:min-w-[14rem]"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="contacts" data-snap="page" className={sectionClass}>
          <div className={shellClass}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)] xl:items-stretch">
              <div className="flex h-full flex-col justify-between rounded-[2rem] border border-white/80 bg-white/68 p-6 shadow-[0_18px_42px_rgba(96,72,50,0.05)] sm:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6241]">{copy.trustEyebrow}</p>
                  <h2 className="mt-3 max-w-[12ch] font-serif text-[1.7rem] font-semibold tracking-[-0.05em] text-[#2d3147] sm:text-[2rem] lg:text-[3.2rem]">
                    {copy.trustTitle}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{copy.trustLine}</p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {copy.trustPoints.map((item, index) => {
                    const icons = [ShieldCheck, Check, MessageSquare]
                    const Icon = icons[index] ?? Check
                    return (
                      <div key={item} className="flex h-full flex-col rounded-[1.35rem] border border-[#efe4d8] bg-[#fffdfa] p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4ebe1] text-[#8d6241]">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{item}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <aside className={innerCardClass}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6241]">Book now</p>
                  <h3 className="mt-3 font-serif text-[2.2rem] font-semibold tracking-[-0.05em] text-[#2d3147] sm:text-[2.8rem]">
                    {copy.finalTitle}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{copy.finalLine}</p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <PrimaryButton
                    href={primaryCtaHref}
                    text={primaryCtaText}
                    className="w-full justify-center px-6 py-3.5 text-sm font-semibold"
                  />
                  <PrimaryButton
                    href="/#services"
                    text={copy.secondaryCta}
                    variant="outlined"
                    className="w-full justify-center px-6 py-3.5 text-sm font-semibold"
                  />
                </div>

                <div className="mt-auto space-y-4 pt-8 text-sm text-slate-600">
                  <a href="mailto:support@qamqorshy.kz" className="inline-flex items-center gap-3 transition-colors duration-200 hover:text-[#8d6241]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4ebe1] text-[#8d6241]">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    {copy.finalSupport}
                  </a>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{copy.footerLine}</p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}








