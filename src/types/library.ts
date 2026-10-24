/**
 * Future shared bridal reference library (~500–1,000 images).
 * Images are purely visual references — no names, codes, products or prices.
 */
export type LibraryCategory =
  | 'bodice'
  | 'skirt'
  | 'sleeves'
  | 'back'
  | 'train'
  | 'lace'
  | 'embroidery'
  | 'applique'
  | 'beading'
  | 'veil'

export const LIBRARY_CATEGORIES: { id: LibraryCategory; label: string }[] = [
  { id: 'bodice', label: 'Bodice' },
  { id: 'skirt', label: 'Skirt' },
  { id: 'sleeves', label: 'Sleeves' },
  { id: 'back', label: 'Back' },
  { id: 'train', label: 'Train' },
  { id: 'lace', label: 'Lace' },
  { id: 'embroidery', label: 'Embroidery' },
  { id: 'applique', label: 'Appliqué' },
  { id: 'beading', label: 'Beading' },
  { id: 'veil', label: 'Veil' },
]

export type LibraryImage = {
  id: string
  category: LibraryCategory
  imageUrl: string
  thumbnailUrl: string
  width: number
  height: number
}

export type LibraryPage = {
  items: LibraryImage[]
  nextCursor: number | null
}
