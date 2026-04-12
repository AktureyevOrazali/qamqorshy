import Header from '@/widgets/header/header'
import { getLangFromCookies } from '@/lib/i18n'
import './globals.css'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const lang = await getLangFromCookies()

  return (
    <html lang={lang}>
      <body>
        <Header />
        <main className="page-transition pt-16 md:pt-20">{children}</main>
      </body>
    </html>
  )
}
