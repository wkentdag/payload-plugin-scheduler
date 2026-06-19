import type { GlobalConfig } from 'payload'

const Home: GlobalConfig = {
  slug: 'home',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    }
  ]

}

export default Home
