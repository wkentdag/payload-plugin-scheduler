import { type CollectionConfig } from 'payload/types'
import Pages from './Pages'

const Posts: CollectionConfig = {
  ...Pages,
  fields: [Pages.fields[0]],
  slug: 'posts',
}

export default Posts
