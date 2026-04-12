'use client'

import { ImagePlus, Paperclip, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import { BACKEND_BASE_URL } from '@/lib/api'

type User = { id: string; fullName: string; role: string }
type Message = {
  id: string
  senderId: string
  receiverId: string
  body: string
  createdAt: string
  attachmentUrl?: string | null
  attachmentMimeType?: string | null
}

type TimelineItem =
  | { type: 'day'; key: string; label: string }
  | { type: 'message'; key: string; message: Message }

async function readJsonSafe(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function getResponseError(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
    return data.detail
  }
  return fallback
}

function resolveAttachmentUrl(url?: string | null) {
  if (!url) {
    return null
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `${BACKEND_BASE_URL}${url}`
}

function getDayKey(value: string) {
  const date = new Date(value)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function formatDayLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (getDayKey(date.toISOString()) === getDayKey(today.toISOString())) {
    return 'Today'
  }

  if (getDayKey(date.toISOString()) === getDayKey(yesterday.toISOString())) {
    return 'Yesterday'
  }

  const sameYear = date.getFullYear() === today.getFullYear()
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)
}

export default function ChatRoom({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [activeUserId, setActiveUserId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingMessagesRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const activeUser = useMemo(
    () => users.find((user) => user.id === activeUserId) ?? null,
    [activeUserId, users]
  )

  const canSend = Boolean(activeUserId && (input.trim() || selectedFile))

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = []
    let lastDayKey = ''

    for (const message of messages) {
      const dayKey = getDayKey(message.createdAt)
      if (dayKey !== lastDayKey) {
        items.push({
          type: 'day',
          key: `day-${dayKey}`,
          label: formatDayLabel(message.createdAt),
        })
        lastDayKey = dayKey
      }

      items.push({
        type: 'message',
        key: message.id,
        message,
      })
    }

    return items
  }, [messages])

  const fetchMessagesForUser = async (userId: string) => {
    const res = await fetch(`/api/messages?withUserId=${userId}`, {
      cache: 'no-store',
    })
    const data = await readJsonSafe(res)

    if (!res.ok) {
      throw new Error(getResponseError(data, 'Unable to load messages'))
    }

    return (data?.messages as Message[] | undefined) || []
  }

  useEffect(() => {
    let cancelled = false
    const loadUsers = async () => {
      const res = await fetch('/api/users', { cache: 'no-store' })
      const data = await readJsonSafe(res)
      if (cancelled) {
        return
      }

      if (!res.ok) {
        setUsers([])
        setActiveUserId('')
        setError(getResponseError(data, 'Unable to load conversations'))
        return
      }

      const nextUsers = (data?.users as User[] | undefined) || []
      setUsers(nextUsers)
      setActiveUserId((currentActiveUserId) => {
        if (currentActiveUserId && nextUsers.some((user) => user.id === currentActiveUserId)) {
          return currentActiveUserId
        }
        return nextUsers[0]?.id || ''
      })
    }
    void loadUsers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeUserId) {
      setMessages([])
      return
    }
    let cancelled = false

    const clearPoll = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }

    const loadMessages = async () => {
      if (loadingMessagesRef.current || document.hidden) {
        return
      }

      loadingMessagesRef.current = true
      try {
        const nextMessages = await fetchMessagesForUser(activeUserId)
        if (cancelled) {
          return
        }
        setMessages(nextMessages)
        setError('')
      } catch (loadError) {
        if (cancelled) {
          return
        }
        setMessages([])
        setError(loadError instanceof Error ? loadError.message : 'Unable to load messages')
      } finally {
        loadingMessagesRef.current = false
      }
    }

    const schedulePoll = () => {
      clearPoll()
      if (cancelled) {
        return
      }
      pollTimeoutRef.current = setTimeout(async () => {
        await loadMessages()
        schedulePoll()
      }, 30000)
    }

    const handleVisibilityRefresh = () => {
      if (document.hidden) {
        clearPoll()
        return
      }
      void loadMessages()
      schedulePoll()
    }

    void loadMessages()
    schedulePoll()
    window.addEventListener('focus', handleVisibilityRefresh)
    document.addEventListener('visibilitychange', handleVisibilityRefresh)

    return () => {
      cancelled = true
      clearPoll()
      window.removeEventListener('focus', handleVisibilityRefresh)
      document.removeEventListener('visibilitychange', handleVisibilityRefresh)
    }
  }, [activeUserId])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setSelectedFile(nextFile)
    event.target.value = ''
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) {
      return
    }

    const targetUserId = activeUserId
    const text = input.trim()
    const file = selectedFile

    setInput('')
    setSelectedFile(null)
    setError('')

    try {
      const res = await (async () => {
        if (file) {
          const formData = new FormData()
          formData.append('receiverId', targetUserId)
          if (text) {
            formData.append('body', text)
          }
          formData.append('image', file)
          return fetch('/api/messages/upload', {
            method: 'POST',
            body: formData,
          })
        }

        return fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: targetUserId, body: text }),
        })
      })()

      const data = await readJsonSafe(res)
      if (!res.ok) {
        throw new Error(getResponseError(data, 'Unable to send message'))
      }

      const createdMessage = data as Message
      if (targetUserId === activeUserId) {
        setMessages((currentMessages) => {
          if (currentMessages.some((message) => message.id === createdMessage.id)) {
            return currentMessages
          }
          return [...currentMessages, createdMessage]
        })
      }
    } catch (sendError) {
      setInput(text)
      setSelectedFile(file)
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message')
    }
  }

  return (
    <div className="grid min-h-0 gap-4 lg:h-[calc(100vh-160px)] lg:grid-cols-[320px_1fr] lg:gap-6">
      <aside className="flex flex-col overflow-hidden rounded-[1.5rem] border border-[#e7dbcf] bg-white shadow-sm sm:rounded-[2rem]">
        <div className="border-b border-slate-50 bg-[#faf9f6]/50 p-4 sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-[#2d3147] sm:text-2xl">Messages</h2>
        </div>
        <div className="custom-scrollbar flex gap-2 overflow-x-auto p-3 md:p-4 lg:flex-1 lg:flex-col lg:space-y-1.5 lg:overflow-y-auto lg:overflow-x-hidden">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setActiveUserId(user.id)}
              className={`group flex min-w-[220px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all lg:min-w-0 lg:py-4 ${
                user.id === activeUserId
                  ? 'bg-[#8d6241] text-white shadow-lg shadow-[#8d6241]/20'
                  : 'text-slate-600 hover:bg-[#faf9f6]'
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-sm font-serif ${
                  user.id === activeUserId
                    ? 'border-white/20 bg-white/20'
                    : 'border-slate-200 bg-slate-100 group-hover:bg-white'
                }`}
              >
                {user.fullName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{user.fullName}</p>
                <p className={`truncate text-[10px] ${user.id === activeUserId ? 'text-white/70' : 'font-light text-slate-400'}`}>
                  {user.role === 'CAREGIVER' ? 'Specialist' : 'Client'}
                </p>
              </div>
            </button>
          ))}
          {users.length === 0 && (
            <div className="w-full py-6 text-center lg:py-10">
              <p className="text-sm font-light italic text-slate-400">No active conversations</p>
            </div>
          )}
        </div>
      </aside>

      <section className="relative flex min-h-[65svh] flex-col overflow-hidden rounded-[1.5rem] border border-[#e7dbcf] bg-white shadow-xl sm:rounded-[2rem] lg:min-h-0">
        {activeUser ? (
          <>
            <div className="flex items-center gap-4 border-b border-slate-50 bg-[#faf9f6]/50 p-4 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#8d6241]/20 bg-[#8d6241]/10 font-serif text-[#8d6241]">
                {activeUser.fullName[0]}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-serif text-lg font-semibold text-[#2d3147] sm:text-xl">{activeUser.fullName}</h2>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-slate-400">Online</span>
                </div>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto bg-[#faf9f6]/30 p-4 sm:p-6">
              <div className="space-y-4">
                {error ? (
                  <div className="rounded-2xl border border-[#f1d4cd] bg-[#fff7f4] px-4 py-3 text-sm text-[#9b5c4b]">
                    {error}
                  </div>
                ) : null}

                {timelineItems.map((item) => {
                  if (item.type === 'day') {
                    return (
                      <div key={item.key} className="flex items-center gap-2 py-2 sm:gap-3">
                        <div className="h-px flex-1 bg-[#e7dbcf]" />
                        <span className="rounded-full border border-[#e7dbcf] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          {item.label}
                        </span>
                        <div className="h-px flex-1 bg-[#e7dbcf]" />
                      </div>
                    )
                  }

                  const msg = item.message
                  const isMine = msg.senderId === currentUserId
                  const attachmentSrc = resolveAttachmentUrl(msg.attachmentUrl)
                  const hasImage = Boolean(attachmentSrc && msg.attachmentMimeType?.startsWith('image/'))

                  return (
                    <div key={item.key} className={`flex animate-in fade-in duration-300 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`relative max-w-[88%] rounded-[1.35rem] px-4 py-3 text-sm shadow-sm sm:max-w-[80%] sm:px-5 sm:py-3.5 lg:max-w-[75%] ${
                          isMine
                            ? 'rounded-br-none bg-[#8d6241] text-white shadow-[#8d6241]/10'
                            : 'rounded-bl-none border border-[#e7dbcf] bg-white text-slate-700'
                        }`}
                      >
                        {hasImage ? (
                          <a href={attachmentSrc || '#'} target="_blank" rel="noreferrer" className="mb-3 block overflow-hidden rounded-2xl">
                            <Image
                              src={attachmentSrc || ''}
                              alt="Message attachment"
                              width={420}
                              height={300}
                              className="max-h-[240px] w-full rounded-2xl object-cover sm:max-h-[280px]"
                              unoptimized
                            />
                          </a>
                        ) : null}
                        {msg.body ? <p className="whitespace-pre-wrap break-words">{msg.body}</p> : null}
                        <p className={`mt-1.5 text-[9px] font-bold uppercase tracking-widest ${isMine ? 'text-white/60' : 'text-slate-300'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {!error && messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center space-y-2 py-10 text-center text-slate-400 opacity-50">
                    <span className="text-4xl">...</span>
                    <p className="text-sm font-light italic">Start your conversation today</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-50 bg-white p-4 sm:p-6">
              {selectedFile ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7dbcf] bg-[#faf9f6] px-4 py-3 text-sm text-slate-600">
                  <div className="flex min-w-0 items-center gap-2">
                    <ImagePlus className="h-4 w-4 shrink-0 text-[#8d6241]" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="rounded-full p-1 text-slate-400 transition-colors hover:text-[#8d6241]"
                    aria-label="Remove selected file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              <form onSubmit={sendMessage} className="flex items-end gap-2 sm:gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 transition-all hover:border-[#d0a144] hover:bg-white hover:text-[#8d6241] sm:h-[58px] sm:w-[58px]"
                  aria-label="Attach image"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-light outline-none transition-all placeholder:text-slate-300 focus:border-[#d0a144] focus:bg-white focus:ring-1 focus:ring-[#d0a144]/10 sm:px-6 sm:py-4"
                  placeholder={selectedFile ? 'Add a caption (optional)...' : 'Type your message...'}
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#8d6241] text-white shadow-lg shadow-[#8d6241]/20 transition-all hover:bg-[#724f35] disabled:opacity-30 disabled:shadow-none sm:h-auto sm:w-auto sm:px-6 sm:py-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#faf9f6]/30 p-8 text-center sm:p-10">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#e7dbcf] bg-white text-4xl shadow-sm sm:h-24 sm:w-24">...</div>
            <h2 className="font-serif text-2xl font-semibold text-[#2d3147]">Select a conversation</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm font-light text-slate-400">Choose an active booking chat from the list above.</p>
          </div>
        )}
      </section>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  )
}
