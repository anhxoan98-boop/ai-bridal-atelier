import type { ComponentType } from '@/types/design'

export type ComponentMeta = {
  type: ComponentType
  step: number
  label: string
  shortLabel: string
  question: string
  hint: string
}

/** Customer-facing wording for each part of the dress. No technical jargon. */
export const COMPONENT_CATALOG: Record<ComponentType, ComponentMeta> = {
  bodice: {
    type: 'bodice',
    step: 1,
    label: 'Top / Bodice',
    shortLabel: 'Bodice',
    question: 'How would you like the top of your dress to look?',
    hint: 'Neckline, corset, fit and shape of the bodice.',
  },
  skirt: {
    type: 'skirt',
    step: 2,
    label: 'Skirt',
    shortLabel: 'Skirt',
    question: 'What kind of skirt do you dream of?',
    hint: 'Volume, layers, length and movement.',
  },
  sleeves: {
    type: 'sleeves',
    step: 3,
    label: 'Shoulders / Sleeves',
    shortLabel: 'Sleeves',
    question: 'Choose your shoulders and sleeves.',
    hint: 'Strapless, off-the-shoulder, cap, long lace sleeves…',
  },
  back: {
    type: 'back',
    step: 4,
    label: 'Back',
    shortLabel: 'Back',
    question: 'How should your dress look from behind?',
    hint: 'Open back, buttons, lace-up, illusion panel.',
  },
  train: {
    type: 'train',
    step: 5,
    label: 'Train',
    shortLabel: 'Train',
    question: 'What train would you like?',
    hint: 'Sweep, chapel, cathedral or royal length.',
  },
  details: {
    type: 'details',
    step: 6,
    label: 'Details / Decoration',
    shortLabel: 'Details',
    question: 'Which details make it yours?',
    hint: 'Lace, embroidery, 3D appliqué, beading, pearls.',
  },
}

export const ORDERED_COMPONENTS: ComponentMeta[] = Object.values(COMPONENT_CATALOG).sort(
  (a, b) => a.step - b.step,
)
