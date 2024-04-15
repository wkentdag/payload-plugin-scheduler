import mongoose from 'mongoose'

module.exports = async function () {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
}
