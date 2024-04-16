import mongoose from 'mongoose'

module.exports = async function () {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()

  // for some reason if you await, it hangs
  globalThis.payloadClient.db.pool?.end()
}
