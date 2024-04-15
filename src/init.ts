import db from 'debug'
import { cancelJob, Job, scheduledJobs } from 'node-schedule'

import { getUpcomingPosts, publishScheduledPost } from './lib'
import { type ScheduledPostConfig } from './types'
import { type Payload } from 'payload'

const debug = db('payload-plugin-scheduler')

export const onInit = (config: ScheduledPostConfig, payload: Payload) => {
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
    //  scheduled to fire at it at its publish_date
    await Promise.all(
      queued.map(async schedule => {
        const { date, post } = schedule
        const id = schedule.id.toString()
        // override any existing job for this same document
        if (Object.keys(scheduledJobs).includes(id)) {
          debug('overriding existing job')
          const canceled = cancelJob(id)
          if (!canceled) {
            console.warn(`Error canceling existing job ${id}, duplicate jobs may exist`)
          }
        }

        const job = new Job(id, publishScheduledPost({ id, post }, payload))

        const scheduled = job.schedule(date)

        if (!scheduled) {
          console.error(`Failed to schedule job ${id} at ${date}`)
        }

        return job
      }),
    )
  })

  scanner.schedule(`*/${config.interval} * * * *`)

  return scanner
}
