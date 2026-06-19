import configPromise from '@payload-config'
import { redirect } from 'next/navigation'

const Page = async () => {
  const config = await configPromise

  redirect(config.routes.admin)
}

export default Page
