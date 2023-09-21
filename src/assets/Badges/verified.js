import React from 'react'

const SVGBadgeVerified = ({ width, height, fillColor, iconFillColor, strokeColor, badgeTitle, locale }) => {
  return (
    <svg width={width || 60} height={height || 60} viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <title>{badgeTitle}</title>
      <path
        d='M60 0L0 60H60V0Z'
        fill={fillColor || '#57C0C3'}
        transform={`${locale === 'ar' ? 'scale(-1 1)' : 'scale(1 1)'}`}
        style={{ transformOrigin: 'center' }}
      />
      <path
        d='M48.165 33.0135L42.165 32.0135C42.0557 31.9955 41.9443 31.9955 41.835 32.0135L35.835 33.0135C35.6017 33.0525 35.3898 33.173 35.2369 33.3535C35.084 33.5341 35.0001 33.7629 35 33.9995V40.9995C35 45.9995 42 47.9995 42 47.9995C42 47.9995 49 45.9995 49 40.9995V33.9995C48.9999 33.7629 48.916 33.5341 48.7631 33.3535C48.6102 33.173 48.3983 33.0525 48.165 33.0135ZM41.065 43.4805L37.293 39.7065L38.707 38.2925L40.933 40.5185L45.233 35.3585L46.769 36.6405L41.065 43.4805Z'
        fill={iconFillColor || '#ffffff'}
        transform={`translate(${locale === 'ar' ? -(width / 2) : 0} 0)`}
      />
    </svg>
  )
}

export default SVGBadgeVerified
