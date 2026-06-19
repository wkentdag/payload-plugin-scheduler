# payload-plugin-scheduler

Payload v3 plugin that adds an imperative `publish_date` scheduling flow with at-a-glance schedule status in the admin UI.

Instead of using Payload's native "Schedule Publish" drawer, this plugin adds a configurable Date field to opted-in collections and globals. When that field is set to a future date, the plugin writes a native Payload `schedulePublish` job with `waitUntil` set to that date.

![ci status](https://github.com/wkentdag/payload-plugin-scheduler/actions/workflows/test.yml/badge.svg)

## Requirements

- Payload v3
- Node 22
- pnpm v11

## Installation

```sh
pnpm add payload-plugin-scheduler
```

## Usage

```ts
// payload.config.ts

import { buildConfig } from 'payload'
import { ScheduledPostPlugin } from 'payload-plugin-scheduler'

import Pages from './collections/Pages'
import Posts from './collections/Posts'
import Home from './globals/Home'
import Users from './collections/Users'

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Pages, Posts, Users],
  globals: [Home],
  plugins: [
    ScheduledPostPlugin({
      collections: ['pages', 'posts'],
      globals: ['home'],
      interval: 10,
    }),
  ],
})
```

Enabled collections and globals must support drafts. The plugin merges the required scheduled-publish draft config into `versions.drafts.schedulePublish` and preserves existing version/draft settings.

## Running Jobs

This plugin creates Payload Jobs; it does not run the job worker for you. Your host app is responsible for running Payload's Jobs Queue.

For a dedicated long-running server, use Payload's job runner, `jobs.autoRun`, or your preferred process manager. For serverless platforms such as Vercel, use Payload's jobs endpoints with an external cron mechanism instead of a long-running in-process worker.

See Payload's docs for current deployment guidance:

- [Jobs Queue](https://payloadcms.com/docs/jobs-queue/overview)
- [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish)

## Options

At least one collection or global slug is required.

### `collections?: string[]`

Collection slugs that should receive scheduling support.

```ts
ScheduledPostPlugin({
  collections: ['pages', 'posts'],
})
```

### `globals?: string[]`

Global slugs that should receive scheduling support.

```ts
ScheduledPostPlugin({
  globals: ['home'],
})
```

### `interval?: number`

Time interval, in minutes, used for the generated Date field's time picker and Payload's scheduled-publish draft config. Defaults to `5`.

```ts
ScheduledPostPlugin({
  collections: ['posts'],
  interval: 15,
})
```

### `publishDate?: object`

Configure the generated publish-date field.

```ts
ScheduledPostPlugin({
  collections: ['posts'],
  publishDate: {
    name: 'scheduled_at',
    label: 'Scheduled At',
    admin: {
      position: 'sidebar',
    },
  },
})
```

Available properties:

- `name?: string` defaults to `publish_date`
- `label?: DateField['label']` defaults to `Publish Date`
- `admin.position?: FieldPosition` defaults to `sidebar`

## Manual Field Placement

By default, the plugin injects the publish-date field into every opted-in collection and global. If you need to place the field manually, use the exported `publishDate()` helper.

```ts
import type { CollectionConfig } from 'payload'
import { publishDate } from 'payload-plugin-scheduler'

export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          label: 'Publishing',
          fields: [publishDate()],
        },
      ],
    },
  ],
}
```

Manual placement is only valid inside collections or globals that are opted in through `ScheduledPostPlugin({ collections, globals })`. If a collection/global already contains `publishDate()`, the plugin will not inject a duplicate.

If you configure a custom field name in the plugin, use the same name for manual placement:

```ts
publishDate({
  name: 'scheduled_at',
  label: 'Scheduled At',
})
```

## Timezones

The default behavior does not add plugin-specific timezone configuration. Payload Date fields submit UTC-resolvable instants, so the plugin queues jobs with:

```ts
waitUntil: new Date(data.publish_date)
```

If the host app configures Payload admin timezones with `admin.timezones`, the plugin opts the publish-date field into Payload's native Date field timezone support. In that mode, Payload adds the companion `<fieldName>_tz` value and the plugin passes that value to the queued `schedulePublish` job when present.

```ts
export default buildConfig({
  admin: {
    user: Users.slug,
    timezones: {
      defaultTimezone: 'America/Los_Angeles',
      supportedTimezones: [
        { label: 'Pacific Time', value: 'America/Los_Angeles' },
        { label: 'Berlin', value: 'Europe/Berlin' },
      ],
    },
  },
  plugins: [
    ScheduledPostPlugin({
      collections: ['posts'],
    }),
  ],
})
```

## SafeRelationship

Drop-in replacement for Payload's `relationship` field. It prevents users from publishing documents that reference related docs which are still draft or scheduled.

```ts
import type { Field } from 'payload'
import { SafeRelationship } from 'payload-plugin-scheduler'

export const featuredContent: Field = SafeRelationship({
  name: 'featured_content',
  relationTo: ['posts', 'pages'],
  hasMany: true,
})
```

## Migration From v2

The v3 plugin no longer creates or writes to a plugin-owned `scheduled_posts` collection, and it no longer uses `node-schedule`. Scheduled publishes are represented as native Payload `schedulePublish` jobs in Payload's jobs collection.

Before upgrading:

- Remove any application code that reads from or customizes `scheduled_posts`.
- Review custom code that assumes the field is named `publish_date`; use `publishDate.name` if you need a different name.
- Ensure opted-in collections/globals can support drafts and scheduled publish.
- Configure and run Payload Jobs in the host app. Dedicated servers and serverless deployments need different worker/cron strategies.
- If you use Payload `admin.timezones`, verify the resulting `<fieldName>_tz` values in your own scheduling flow.
