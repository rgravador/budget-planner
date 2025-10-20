'use client'

import { App } from 'antd'

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <App>{children}</App>
}
