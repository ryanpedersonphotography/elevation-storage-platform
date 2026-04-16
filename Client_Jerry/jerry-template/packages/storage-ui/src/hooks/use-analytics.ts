'use client'
import { useContext, useCallback } from 'react'
import { FacilityContext } from '../providers/facility-provider'

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function useAnalytics() {
  const facility = useContext(FacilityContext)
  const track = useCallback((event: string) => {
    const events = facility?.analytics?.gtagEvents as Record<string, boolean> | undefined
    if (facility?.analytics?.gtag && events?.[event]) {
      window.gtag?.('event', event)
    }
  }, [facility])
  return { track }
}
