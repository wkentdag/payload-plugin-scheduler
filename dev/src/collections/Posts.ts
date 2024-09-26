import { type CollectionConfig } from 'payload/types'

const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export default Posts
