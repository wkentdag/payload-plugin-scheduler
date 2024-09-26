import { addMinutes, subMinutes } from "date-fns"
import type { Payload } from "payload"

describe('SafeRelationshipField', () => {
  const payload = globalThis.payloadClient as Payload

  describe('false positives', () => {
    test('published docs', async () => {
      const publishedPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'published',
          publish_date: subMinutes(new Date(), 10).toISOString(),
          _status: 'published',
        }
      })
      
      const published = await payload.create({
        collection: 'pages',
        data: {
          title: 'published',
          featured_post: publishedPost.id,
          _status: 'published',
        }
      })
  
      expect(published._status).toBe('published')
      expect(published.featured_post.id).toEqual(publishedPost.id)
    })

    test('draft docs', async () => {
      const scheduledPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'scheduled',
          publish_date: addMinutes(new Date(), 10).toISOString(),
          _status: 'draft',
        }
      })
  
      const draftPage = await payload.create({
        collection: 'pages',
        data: {
          title: 'second page',
          featured_post: scheduledPost.id,
          _status: 'draft',
        }
      })
  
      expect(draftPage._status).toBe('draft')
      expect(draftPage.featured_post.id).toBe(scheduledPost.id)
    })

    test('polymorphic field', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'page',
          _status: 'published',
        }
      })
  
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'published',
          _status: 'published'
        }
      })

      await expect(payload.create({
        collection: 'pages',
        data: {
          title: 'mixed',
          polymorphic: [page.id, post.id],
          _status: 'published',
        }
      })).resolves.not.toThrow()
    })

    test('mixed field', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'page',
          _status: 'published',
        }
      })
  
      const basic = await payload.create({
        collection: 'basics',
        data: {
          title: 'published',
          _status: 'published'
        }
      })

      await expect(payload.create({
        collection: 'pages',
        data: {
          title: 'mixed',
          polymorphic: [page.id, basic.id],
          _status: 'published',
        }
      })).resolves.not.toThrow()
    })
  })

  describe('errors', () => {
    test('related document is scheduled after current document', async () => {
      const scheduledPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'scheduled',
          publish_date: addMinutes(new Date(), 10).toISOString(),
          _status: 'draft',
        }
      })
  
      await expect(payload.create({
        collection: 'pages',
        data: {
          title: 'second page',
          featured_post: scheduledPost.id,
          _status: 'published',
        }
      })).rejects.toThrow('The following field is invalid: featured_post')
    })
  })

  test('one invalid document out of multiple', async () => {
    const scheduledPage = await payload.create({
      collection: 'pages',
      data: {
        title: 'scheduled',
        publish_date: addMinutes(new Date(), 10).toISOString(),
        _status: 'draft',
      }
    })

    const publishedPage = await payload.create({
      collection: 'pages',
      data: {
        title: 'published',
        _status: 'published',
      }
    })

    await expect(payload.create({
      collection: 'pages',
      data: {
        title: 'multiple',
        related_pages: [scheduledPage.id, publishedPage.id],
        _status: 'published',
      }
    })).rejects.toThrow('The following field is invalid: related_pages')
  })

  test('one invalid document out of polymorphic', async () => {
    const scheduledPage = await payload.create({
      collection: 'pages',
      data: {
        title: 'scheduled',
        publish_date: addMinutes(new Date(), 10).toISOString(),
        _status: 'draft',
      }
    })

    const publishedPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'published',
        _status: 'published',
      }
    })

    await expect(payload.create({
      collection: 'pages',
      data: {
        title: 'multiple',
        polymorphic: [scheduledPage.id, publishedPost.id],
        _status: 'published',
      }
    })).rejects.toThrow('The following field is invalid: polymorphic')
  })

  test('one invalid document out of mixed', async () => {
    const scheduledPage = await payload.create({
      collection: 'pages',
      data: {
        title: 'scheduled',
        publish_date: addMinutes(new Date(), 10).toISOString(),
        _status: 'draft',
      }
    })

    const basic = await payload.create({
      collection: 'basics',
      data: {
        title: 'basic',
      }
    })

    await expect(payload.create({
      collection: 'pages',
      data: {
        title: 'multiple',
        polymorphic: [scheduledPage.id, basic.id],
        _status: 'published',
      }
    })).rejects.toThrow('The following field is invalid: mixed')
  })
})