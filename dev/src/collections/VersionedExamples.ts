import { CollectionConfig } from 'payload/types'
import Examples from './Examples'

const VersionedExamples: CollectionConfig = {
  ...Examples,
  slug: 'versioned_examples',
  versions: {
    drafts: true,
  },
}

export default VersionedExamples
