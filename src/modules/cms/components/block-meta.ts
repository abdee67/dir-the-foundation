import type { CmsBlock } from '@/types/db'

export interface CategoryOption {
  id: string
  name: string
}

export const BLOCK_TYPES: CmsBlock['_type'][] = [
  'hero',
  'richText',
  'productGrid',
  'banner',
  'imageWithText',
  'faq',
  'testimonials',
  'contact',
  'listingsGrid',
  'coursesGrid',
  'html',
]

export const BLOCK_LABELS: Record<CmsBlock['_type'], string> = {
  hero: 'Hero',
  richText: 'Rich Text',
  productGrid: 'Product Grid',
  banner: 'Banner',
  imageWithText: 'Image with Text',
  faq: 'FAQ',
  testimonials: 'Testimonials',
  contact: 'Contact',
  listingsGrid: 'Listings Grid',
  coursesGrid: 'Courses Grid',
  html: 'Custom HTML',
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** One-line summary shown on a block's card in the left-column list. */
export function blockSummary(block: CmsBlock): string {
  switch (block._type) {
    case 'hero':
      return block.heading || 'Untitled heading'
    case 'richText':
      return block.html ? stripHtml(block.html).slice(0, 60) : 'Empty'
    case 'productGrid': {
      const modeLabel = block.mode === 'category' ? 'Category' : 'Hand-picked'
      return `${modeLabel}${block.limit ? ` · limit ${block.limit}` : ''}`
    }
    case 'banner':
      return block.href || 'No link'
    case 'imageWithText':
      return block.heading || 'Untitled heading'
    case 'faq':
      return `${block.items.length} question${block.items.length === 1 ? '' : 's'}`
    case 'testimonials':
      return block.mode === 'reviews' ? 'From published reviews' : `${block.items?.length ?? 0} testimonial(s)`
    case 'contact':
      return block.heading || 'Untitled heading'
    case 'listingsGrid':
      return block.limit ? `Limit ${block.limit}` : 'All active listings'
    case 'coursesGrid':
      return block.limit ? `Limit ${block.limit}` : 'All active courses'
    case 'html':
      return block.raw ? block.raw.slice(0, 60) : 'Empty'
    default:
      return ''
  }
}

export function createBlock(type: CmsBlock['_type'], key: string): CmsBlock {
  switch (type) {
    case 'hero':
      return { _key: key, _type: 'hero', heading: '' }
    case 'richText':
      return { _key: key, _type: 'richText', html: '' }
    case 'productGrid':
      return { _key: key, _type: 'productGrid', mode: 'manual', productIds: [], limit: 8 }
    case 'banner':
      return { _key: key, _type: 'banner', image: '' }
    case 'imageWithText':
      return { _key: key, _type: 'imageWithText', image: '', heading: '', body: '', imageSide: 'left' }
    case 'faq':
      return { _key: key, _type: 'faq', items: [] }
    case 'testimonials':
      return { _key: key, _type: 'testimonials', items: [] }
    case 'contact':
      return { _key: key, _type: 'contact', heading: '', showForm: true }
    case 'listingsGrid':
      return { _key: key, _type: 'listingsGrid', limit: 6 }
    case 'coursesGrid':
      return { _key: key, _type: 'coursesGrid', limit: 6 }
    case 'html':
      return { _key: key, _type: 'html', raw: '' }
  }
}
