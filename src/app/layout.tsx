import '@ant-design/v5-patch-for-react-19'
import type { Metadata } from 'next'
import { AntdRegistry } from '@/lib/antd/AntdRegistry'
import { TRPCProvider } from '@/lib/trpc/client'
import { AuthProvider } from '@/lib/auth/useUser'
import './globals.css'

export const metadata: Metadata = {
  title: 'Budget Planner',
  description: 'A budget planning application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <TRPCProvider>
            <AuthProvider>{children}</AuthProvider>
          </TRPCProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
