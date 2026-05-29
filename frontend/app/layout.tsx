import './globals.css'

export const metadata = {
  title: 'TECNIO — Asistente REBT',
  description: 'Academia de electricistas profesionales',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}