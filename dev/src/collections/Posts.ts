import { type CollectionBeforeChangeHook, type CollectionConfig } from 'payload'

const preventAuthenticatedPublish: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user && data._status === 'published') {
    throw new Error('Authenticated test users cannot publish posts directly')
  }

  return data
}

const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [preventAuthenticatedPublish],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

export default Posts
