import mongoose from 'mongoose'

module.exports = async function closeDb() {
  if (process.env.PAYLOAD_CONFIG_PATH?.includes('mongo')) {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  }

  if (process.env.PAYLOAD_CONFIG_PATH?.includes('postgres')) {
      // for some reason if you await, it hangs
      globalThis.payloadClient.db.pool?.end()
  }

}
