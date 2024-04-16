import mongoose from 'mongoose'

module.exports = async function () {
  // @TODO determine which db is in use and await connection end
  mongoose.connection.dropDatabase()
  mongoose.connection.close()

  // for some reason if you await, it hangs
  globalThis.payloadClient.db.pool?.end()
}
