import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: {
    default: 'MathU – Matematik 1b',
    template: '%s | MathU',
  },
  description: 'Lär dig Matematik 1b på ett roligt och effektivt sätt med MathU.',
  keywords: ['matematik', 'matte1b', 'gymnasiet', 'lärande', 'mathu'],
  authors: [{ name: 'MathU' }],
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-white text-text antialiased">
        {children}
      </body>
    </html>
  )
}
