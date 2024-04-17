# payload-plugin-scheduler

Payload plugin that enables scheduled publishing for draft-enabled collections, inspired by wordpress post scheduler.

![ci status](https://github.com/wkentdag/payload-plugin-scheduler/actions/workflows/test.yml/badge.svg)

## Installation

```sh
npm i payload-plugin-scheduler
```

## Usage

```ts
// payload.config.ts

import { buildConfig } from 'payload/config'
import { ScheduledPostPlugin } from 'payload-plugin-scheduler'
import Pages from './collections/Pages'
import Posts from './collections/Posts'

export default buildConfig({
  collections: [Pages, Posts],
  plugins: [
    ScheduledPostPlugin({
      collections: ['pages', 'posts'],
      interval: 10,
    })
  ]
  // ...more config
})

```

## Options

### `collections: string[]`

An array of collection slugs. All collections must have drafts enabled.

### `interval?: number`

Specify how frequently to check for scheduled posts (in minutes).
This value will also be passed to the `DatePicker` component. Defaults to 5 mins.


### `scheduledPosts?: Partial<CollectionConfig>`

Custom configuration for the scheduled posts collection that gets merged with the defaults.


## Approach

In a nutshell, the plugin creates a `publish_date` field that it uses to determine whether a pending draft update needs to be scheduled.

### `publish_date`

Custom Datetime field added to documents in enabled collections.
Includes custom `Field` and `Cell` components that include schedule status in the client-side UI.

### `scheduled_posts`

Collection added by the plugin to store pending schedule updates. Can be customized via `scheduledPosts` option.

### Cron

A configurable timer checks for any posts to be scheduled in the upcoming interval window. For each hit, it creates a separate job that's fired at that document's `publish_date` (via [node-schedule](https://github.com/node-schedule/node-schedule)). The idea here is that you can configure your interval window to avoid super long running tasks that are more prone to flaking.


## Notes

Since the plugin uses cron under the hood, it depends on a long-running server and is incompatible with short-lived/serverless environments like ECS, or Vercel if you're using Payload 3.0 beta.

I developed this plugin for a project that hasn't gone live yet. It has good test coverage but not in the wild yet -- there's your disclaimer.