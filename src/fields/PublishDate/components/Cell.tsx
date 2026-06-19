'use client'

import React from 'react'

import { formatDateTime } from '../util.js'
import Icon from './Icon.js'

interface Props {
  cellData?: unknown
}

const Cell: React.FC<Props> = ({ cellData }) => {
  if (!cellData) {return null}

  const pubDate = new Date(cellData as string)
  const scheduled = pubDate > new Date()

  return (
    <div
      style={{
        ...(scheduled ? { color: 'var(--color-warning-650' } : {}),
      }}
    >
      {scheduled && <Icon />}
      {formatDateTime(new Date(cellData as string), false)}
    </div>
  )
}

export default Cell
