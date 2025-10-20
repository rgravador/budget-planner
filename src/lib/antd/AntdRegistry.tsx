'use client'

import React from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider, App } from 'antd'
import type Entity from '@ant-design/cssinjs/es/Cache'

export function AntdRegistry({ children }: { children: React.ReactNode }) {
  const cache = React.useMemo<Entity>(() => createCache(), [])
  const isServerInserted = React.useRef<boolean>(false)

  useServerInsertedHTML(() => {
    // Avoid duplicate style insertion
    if (isServerInserted.current) {
      return
    }
    isServerInserted.current = true
    return <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
  })

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        theme={{
          token: {
            // Navy Blue and Gold Theme
            colorPrimary: '#003366', // Navy Blue
            colorSuccess: '#52c41a',
            colorWarning: '#D4AF37', // Gold
            colorError: '#ff4d4f',
            colorInfo: '#003366', // Navy Blue
            colorLink: '#003366', // Navy Blue
            colorBgContainer: '#ffffff',
            borderRadius: 8,
            fontSize: 14,
          },
          components: {
            Layout: {
              headerBg: '#003366', // Navy Blue header
              headerColor: '#ffffff',
            },
            Button: {
              primaryShadow: '0 2px 0 rgba(0, 51, 102, 0.1)',
            },
            Menu: {
              itemSelectedBg: '#D4AF37', // Gold for selected items
              itemSelectedColor: '#003366',
            },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  )
}
