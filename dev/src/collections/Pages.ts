import { type CollectionConfig } from 'payload'

import { SafeRelationship } from '../../../src/index.js'

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
    SafeRelationship({
      relationTo: 'posts',
      name: 'featured_post',
      label: 'Featured Post',
      hasMany: false,
    }),
    SafeRelationship({
      relationTo: 'pages',
      name: 'related_pages',
      label: 'Related Pages',
      hasMany: true,
    }),
    SafeRelationship({
      relationTo: ['pages', 'basics'],
      name: 'mixed_relationship',
      hasMany: true,
    }),
    SafeRelationship({
      relationTo: ['pages', 'posts'],
      name: 'polymorphic',
      hasMany: true,
    })
  ],
}

export default Pages
