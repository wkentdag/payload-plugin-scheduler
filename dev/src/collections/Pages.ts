import { type CollectionConfig } from 'payload/types'
// @ts-expect-error
import { SafeRelationship } from '../../../src'

// Example Collection - For reference only, this must be added to payload.config.ts to be used.
const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'textarea',
    },
    // @ts-expect-error @TODO fix clashing react/payload deps
    SafeRelationship({
      relationTo: 'posts',
      name: 'featured_post',
      label: 'Featured Post',
      hasMany: false,
    }),
    // @ts-expect-error @TODO fix clashing react/payload deps
    SafeRelationship({
      relationTo: 'pages',
      name: 'related_pages',
      label: 'Related Pages',
      hasMany: true,
    }),
    // @ts-expect-error @TODO fix clashing react/payload deps
    SafeRelationship({
      relationTo: ['pages', 'basics'],
      name: 'mixed_relationship',
      hasMany: true,
    }),
    // @ts-expect-error @TODO fix clashing react/payload deps
    SafeRelationship({
      relationTo: ['pages', 'posts'],
      name: 'polymorphic',
      hasMany: true,
    })
  ],
}

export default Pages
