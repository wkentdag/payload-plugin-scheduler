import type { GlobalConfig } from "payload/types";

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