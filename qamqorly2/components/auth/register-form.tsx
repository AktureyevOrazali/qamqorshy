'use client'

import { Check, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'CLIENT' | 'CAREGIVER'
type CareCategory = 'CHILD' | 'PET' | 'ELDER'

const caregiverCategories: Array<{ id: CareCategory; label: string; description: string }> = [
  { id: 'CHILD', label: 'Child care', description: 'Families and babysitting requests' },
  { id: 'PET', label: 'Pet care', description: 'Walking, feeding, and home visits' },
  { id: 'ELDER', label: 'Elder care', description: 'Daily support and companionship' },
]

export default function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>('CLIENT')
  const [categories, setCategories] = useState<CareCategory[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleCategory = (category: CareCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    )
  }

  const onRoleChange = (nextRole: Role) => {
    setRole(nextRole)
    setError('')
    if (nextRole === 'CLIENT') {
      setCategories([])
      setHourlyRate('')
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (role === 'CAREGIVER' && categories.length === 0) {
      setLoading(false)
      setError('Select at least one care category')
      return
    }

    if (role === 'CAREGIVER' && (!hourlyRate || Number(hourlyRate) <= 0)) {
      setLoading(false)
      setError('Set your hourly rate')
      return
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        phone,
        email,
        password,
        role,
        categories: role === 'CAREGIVER' ? categories : undefined,
        hourlyRate: role === 'CAREGIVER' ? Number(hourlyRate) : undefined,
      }),
    })
    const data = await res.json()

    setLoading(false)
    if (!res.ok) {
      setError(data.detail || data.error || 'Registration failed')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        className="q-input py-3.5"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        className="q-input py-3.5"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="q-input py-3.5"
      />
      <div className="relative">
        <input
          required
          type={showPassword ? 'text' : 'password'}
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="q-input py-3.5 pr-14"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-3 flex items-center justify-center rounded-full px-2 text-slate-400 transition-colors hover:text-[#8d6241]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#e7dbcf] bg-[#faf9f6] p-1.5">
        <button
          type="button"
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${role === 'CLIENT' ? 'bg-[#8d6241] text-white shadow-lg shadow-[#8d6241]/20' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => onRoleChange('CLIENT')}
        >
          Client
        </button>
        <button
          type="button"
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${role === 'CAREGIVER' ? 'bg-[#8d6241] text-white shadow-lg shadow-[#8d6241]/20' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => onRoleChange('CAREGIVER')}
        >
          Care Specialist
        </button>
      </div>

      {role === 'CAREGIVER' && (
        <div className="space-y-3 rounded-[1.75rem] border border-[#e7dbcf] bg-[linear-gradient(180deg,#fffdfb_0%,#fbf5ee_100%)] p-4 shadow-[0_18px_40px_rgba(141,98,65,0.08)]">
          <div>
            <p className="text-sm font-semibold text-[#2d3147]">Choose your care sections</p>
            <p className="mt-1 text-xs text-slate-500">You can select one or several categories.</p>
          </div>
          <div className="grid gap-3">
            {caregiverCategories.map((category) => {
              const selected = categories.includes(category.id)
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`group relative overflow-hidden rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200 ${selected ? 'border-[#a36f45] bg-[linear-gradient(135deg,rgba(255,250,245,1)_0%,rgba(246,233,220,1)_100%)] shadow-[0_16px_28px_rgba(141,98,65,0.14)]' : 'border-[#eadfd3] bg-white/92 hover:border-[#cfb095] hover:shadow-[0_14px_24px_rgba(141,98,65,0.08)]'}`}
                >
                  <span className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-r-full transition-all ${selected ? 'bg-[linear-gradient(180deg,#d4a15a_0%,#8d6241_100%)] opacity-100' : 'bg-[#eadfd3] opacity-0 group-hover:opacity-100'}`} />
                  <div className="flex items-center justify-between gap-4 pl-2">
                    <div>
                      <p className={`text-base font-semibold transition-colors ${selected ? 'text-[#6f492d]' : 'text-[#2d3147]'}`}>{category.label}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{category.description}</p>
                    </div>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${selected ? 'border-[#9b6a43] bg-[linear-gradient(180deg,#b07a4d_0%,#8d6241_100%)] text-white shadow-[0_10px_18px_rgba(141,98,65,0.25)]' : 'border-[#e6e9f0] bg-[#f5f7fb] text-slate-400 group-hover:border-[#d9c1aa] group-hover:bg-[#fbf3ea]'}`}
                      aria-hidden="true"
                    >
                      <Check className={`h-5 w-5 transition-all ${selected ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-90 group-hover:opacity-40'}`} />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          <label className="block space-y-2 pt-1">
            <span className="text-xs font-semibold text-[#2d3147]">Hourly rate for selected sections</span>
            <div className="relative">
              <input
                type="number"
                min={1000}
                step={1000}
                inputMode="numeric"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="For example: 7000"
                className="q-input py-3.5 pr-20"
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                KZT/h
              </span>
            </div>
            <p className="text-xs text-slate-500">
              This rate will be used in your profile and booking requests.
            </p>
          </label>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 border border-rose-100">
          <span>!</span> {error}
        </div>
      )}
      <button
        disabled={loading}
        type="submit"
        className="w-full rounded-2xl bg-[#8d6241] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[#8d6241]/20 transition-all hover:bg-[#724f35] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
