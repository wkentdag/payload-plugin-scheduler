import { cancelJob, Job, scheduledJobs } from 'node-schedule'

import { type Payload } from 'payload'
import { getUpcomingPosts, publishScheduledPost } from './lib'
import { type ScheduledPostConfig } from './types'

import { debug } from './util'

export const onInit = (config: ScheduledPostConfig, payload: Payload): Job => {
  debug('init')
  const scanner = new Job('scanner', async () => {
    debug('scanning')

    // find schedules set to publish in this timeframe
    const scheduledPosts = await getUpcomingPosts(config.interval!, payload)

    if (scheduledPosts.totalDocs === 0) {
      debug('scanner exiting')
      return
    }

    const { docs: queued } = scheduledPosts
    debug(`${queued.length} posts to schedule`)

    // create a job for each document,
    //  scheduled to fire at its publish_date
    await Promise.all(
      queued.map(async schedule => {
        const { date, post } = schedule
        const id = schedule.id.toString()
        // overwrite any existing job for this same document
        if (Object.keys(scheduledJobs).includes(id)) {
          debug('overwrite existing job')
          const canceled = cancelJob(id)
          if (!canceled) {
            payload.logger.warn(`Error canceling existing job ${id}, duplicate jobs may exist`)
          }
        }

        const job = new Job(id, publishScheduledPost({ post }, payload))

        const scheduled = job.schedule(date)

        if (!scheduled) {
          payload.logger.error(`[payload-plugin-scheduler] Failed to schedule post ${id}`)
        }

        return job
      }),
    )
  })

  scanner.schedule(`*/${config.interval} * * * *`)

  return scanner
}
