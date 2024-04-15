import { CollectionConfig } from 'payload/types'
import Pages from './Pages'

const Posts: CollectionConfig = {
  ...Pages,
  slug: 'posts',
}

export default Posts
