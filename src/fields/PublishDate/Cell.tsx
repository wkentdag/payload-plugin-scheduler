import React from 'react';
import { Props } from 'payload/components/views/Cell';
import './styles.scss';
import { formatDateTime } from './util';

const Cell: React.FC<Props> = ({ cellData }) => {
  if (!cellData) return null;

  const pubDate = new Date(cellData as string)
  const scheduled = pubDate > new Date()

  return (
    <div
      style={{
        ...(scheduled ? { color: 'var(--color-warning-650' } : {})
      }}
    >
      {scheduled && 'Scheduled:'} {formatDateTime(new Date(cellData as string), scheduled)}
    </div >
  )
}

export default Cell;