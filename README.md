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
import Home from './globals/Home'

export default buildConfig({
  collections: [Pages, Posts],
  globals: [Home],
  plugins: [
    ScheduledPostPlugin({
      collections: ['pages', 'posts'],
      globals: ['home'],
      interval: 10,
    })
  ]
  // ...more config
})

```

## Options

At least one collection / global is required.

### `collections?: string[]`

An array of collection slugs. All collections must have drafts enabled.

### `globals?: string[]`

An array of global slugs. All globals must have drafts enabled.

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


## Caveats

* This plugin doesn't support Payload 3.0 beta. I intend to update it once 3.0 is stable, but it'll require substantial re-architecting to work in a serverless environment.

* There's no logic in place to dedupe schedules across multiple instances of a single app (see https://github.com/wkentdag/payload-plugin-scheduler/issues/9)