export type { Template } from './types'
export { modern } from './modern'
export { bold } from './bold'
export { friendly } from './friendly'
export { trojan } from './trojan'

import { modern } from './modern'
import { bold } from './bold'
import { friendly } from './friendly'
import { trojan } from './trojan'
import type { Template } from './types'

export const templates: Record<string, Template> = { modern, bold, friendly, trojan }
