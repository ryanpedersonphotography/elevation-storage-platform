'use client'
import { useContext } from 'react'
import { FacilityContext } from '../providers/facility-provider'

export function useFacility() {
  const facility = useContext(FacilityContext)
  if (!facility) throw new Error('useFacility must be used within FacilityProvider')
  return facility
}
