import { type CollectionConfig } from 'payload/types'

const Basics: CollectionConfig = {
  slug: 'basics',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export default Basics
