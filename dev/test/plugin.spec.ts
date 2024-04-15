import { SearchIndex } from 'algoliasearch'
import { type Payload } from 'payload'
import { SearchRecord } from '../src/payload.config'

const waitFor = (time: number) => new Promise(resolve => setTimeout(resolve, time))

describe('Plugin tests', () => {
  const payload = globalThis.payloadClient as Payload
  const algolia = globalThis.algoliaClient as SearchIndex

  const getRecord = async (id: string, wait: number = 0) => {
    if (wait) {
      await waitFor(wait)
    }

    return algolia.getObject<SearchRecord>(id)
  }

  it('indexes documents', async () => {
    const doc1 = await payload.create({
      collection: 'examples',
      data: {
        title: 'hello',
        text: 'world',
      },
    })

    expect(typeof doc1.id).toBe('string')

    const record = await getRecord(`examples:${doc1.id}`)
    expect(record).toHaveProperty('title')
  })

  it('ignores drafts', async () => {
    const doc = await payload.create({
      collection: 'versioned_examples',
      draft: true,
      data: {
        title: 'hello',
        text: 'world',
      },
    })

    expect(typeof doc.id).toBe('string')

    try {
      await getRecord(`versioned_examples:${doc.id}`)
    } catch (error) {
      expect(error?.message).toEqual('ObjectID does not exist')
      expect(error?.status).toEqual(404)
    }
  })

  it(
    'retains published index on draft update',
    async () => {
      const doc = await payload.create({
        collection: 'versioned_examples',
        data: {
          title: 'first draft',
          text: 'lorem ipsum',
          _status: 'published',
        },
      })

      expect(typeof doc.id).toBe('string')

      const initialRecord = await getRecord(`versioned_examples:${doc.id}`)
      expect(initialRecord.title).toEqual('first draft')

      const draftUpdate = await payload.update({
        collection: 'versioned_examples',
        id: doc.id,
        draft: true,
        data: {
          title: 'second draft',
        },
      })

      expect(draftUpdate.id).toEqual(doc.id)

      const record = await getRecord(`versioned_examples:${doc.id}`)
      expect(record.title).toEqual('first draft')
    },
    10 * 1000,
  )

  it(
    'indexes drafts on publish',
    async () => {
      const doc = await payload.create({
        collection: 'versioned_examples',
        draft: true,
        data: {
          title: 'first draft',
          text: 'content',
        },
      })

      expect(doc._status).toBe('draft')

      try {
        await getRecord(`versioned_examples:${doc.id}`)
      } catch (error) {
        expect(error?.message).toEqual('ObjectID does not exist')
        expect(error?.status).toEqual(404)
      }

      const updatedDoc = await payload.update({
        collection: 'versioned_examples',
        id: doc.id,
        data: {
          title: 'updated',
          _status: 'published',
        },
      })

      expect(updatedDoc._status).toBe('published')
      const record = await getRecord(`versioned_examples:${doc.id}`)
      expect(record.title).toBe('updated')
    },
    10 * 1000,
  )

  it('accepts custom `getSearchAttributes`', async () => {
    const doc = await payload.create({
      collection: 'examples',
      data: {
        title: 'test',
        text: 'doc',
      },
    })

    const record = await getRecord(`examples:${doc.id}`)
    expect(record.custom).toBe('attribute')
  })
})
