import React from 'react'

export default function Icon({ color = 'var(--color-warning-650)', style }: { color?: string, style?: React.CSSProperties }) {
  return (
    <svg
      width="16px"
      height="16px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginBottom: '2px', marginRight: '2px', ...style }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <path
        d="M12 6V12L16.5 16.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  )
}
