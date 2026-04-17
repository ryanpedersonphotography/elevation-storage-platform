'use client'
import { createContext, type ReactNode } from 'react'
import type { FacilityConfig } from '@jerry/facility-config/schema'

export const FacilityContext = createContext<FacilityConfig | null>(null)

export function FacilityProvider({
  facility,
  children,
}: {
  facility: FacilityConfig
  children: ReactNode
}) {
  return (
    <FacilityContext.Provider value={facility}>
      {children}
    </FacilityContext.Provider>
  )
}
