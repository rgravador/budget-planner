/**
 * Device fingerprinting utility
 * Generates a unique identifier for the current device
 */

export interface DeviceInfo {
  fingerprint: string
  userAgent: string
  platform: string
  screenResolution: string
  timezone: string
  language: string
}

/**
 * Generates a device fingerprint based on browser characteristics
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = []

  // User agent
  components.push(navigator.userAgent)

  // Platform
  components.push(navigator.platform)

  // Screen resolution
  components.push(`${window.screen.width}x${window.screen.height}`)

  // Color depth
  components.push(String(window.screen.colorDepth))

  // Timezone offset
  components.push(String(new Date().getTimezoneOffset()))

  // Language
  components.push(navigator.language)

  // Hardware concurrency (CPU cores)
  components.push(String(navigator.hardwareConcurrency || 'unknown'))

  // Device memory (if available)
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory
  if (deviceMemory) {
    components.push(String(deviceMemory))
  }

  // Canvas fingerprint (lightweight version)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    canvas.width = 200
    canvas.height = 50
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Device ID', 2, 15)
    components.push(canvas.toDataURL())
  }

  // Combine all components and hash
  const combinedString = components.join('|')
  const fingerprint = await hashString(combinedString)

  return fingerprint
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Get detailed device information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const fingerprint = await generateDeviceFingerprint()

  return {
    fingerprint,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  }
}

/**
 * Store device fingerprint in localStorage
 */
export function storeDeviceFingerprint(fingerprint: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('device_fingerprint', fingerprint)
  }
}

/**
 * Get stored device fingerprint from localStorage
 */
export function getStoredDeviceFingerprint(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('device_fingerprint')
  }
  return null
}

/**
 * Clear stored device fingerprint
 */
export function clearDeviceFingerprint(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('device_fingerprint')
  }
}
