import { isRecord } from './http.js'

const COMPONENT_TYPES = ['bodice', 'skirt', 'sleeves', 'back', 'train', 'details']
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

/** Returns an error message, or null when the input is acceptable. */
export function validateImagePayload(v: unknown, field: string): string | null {
  if (!isRecord(v)) return `${field} is required.`
  const hasData = typeof v.dataUrl === 'string'
  const hasPath = typeof v.storagePath === 'string'
  if (!hasData && !hasPath) return `${field} needs dataUrl or storagePath.`
  if (hasData && !IMAGE_DATA_URL.test(v.dataUrl as string)) return `${field}.dataUrl must be a JPG, PNG or WEBP data URL.`
  if (hasPath && (v.storagePath as string).includes('..')) return `${field}.storagePath is invalid.`
  return null
}

export function validateAction(action: string, body: unknown): string | null {
  if (!isRecord(body)) return 'Body must be a JSON object.'
  switch (action) {
    case 'analyze-overall':
      return validateImagePayload(body.image, 'image')
    case 'analyze-component':
      if (!COMPONENT_TYPES.includes(String(body.componentType))) return 'componentType is invalid.'
      return validateImagePayload(body.image, 'image')
    case 'create-brief':
      return Array.isArray(body.components) ? null : 'components must be an array.'
    case 'generate':
      return isRecord(body.brief) ? null : 'brief is required.'
    case 'edit':
      if (typeof body.instruction !== 'string') return 'instruction is required.'
      if (body.instruction.length > 2000) return 'instruction is too long.'
      return validateImagePayload(body.currentImage, 'currentImage')
    case 'analyze-drawing':
      return validateImagePayload(body.currentImage, 'currentImage')
    case 'make-it-real':
      return validateImagePayload(body.design, 'design')
    case 'create-video':
      return Array.isArray(body.designs) ? null : 'designs must be an array.'
    default:
      return 'Unknown action.'
  }
}
