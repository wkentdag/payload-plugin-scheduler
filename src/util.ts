import db from 'debug'
import pkg from '../package.json'

export const debug = db(pkg.name)
