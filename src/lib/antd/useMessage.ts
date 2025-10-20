'use client'

import { App } from 'antd'

/**
 * Custom hook to access Ant Design message API from App context
 * This is the correct way to use message, modal, and notification in Ant Design v5
 *
 * @example
 * const message = useMessage()
 * message.success('Operation successful!')
 * message.error('Operation failed!')
 */
export function useMessage() {
  const { message } = App.useApp()
  return message
}

/**
 * Custom hook to access Ant Design modal API from App context
 *
 * @example
 * const modal = useModal()
 * modal.confirm({ title: 'Are you sure?' })
 */
export function useModal() {
  const { modal } = App.useApp()
  return modal
}

/**
 * Custom hook to access Ant Design notification API from App context
 *
 * @example
 * const notification = useNotification()
 * notification.open({ message: 'Notification', description: 'This is a notification' })
 */
export function useNotification() {
  const { notification } = App.useApp()
  return notification
}
