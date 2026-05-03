import React, { useState } from 'react'

// Dynamically resolve ShreeRam.jpg OR ShreeRam.jpeg — whichever the client provides
const _ctx = require.context('../../assets/images/contract', false, /^\.\/ShreeRam\.(jpg|jpeg)$/)
const _key = _ctx.keys()[0]
const shreeRamSrc = _key ? _ctx(_key) : ''

/**
 * ShreeRamImage
 * Automatically detects image orientation at runtime:
 *  - Landscape (width > height)  → renders with landscapeStyle  (3:1 ratio)
 *  - Portrait / Square           → renders with portraitStyle   (current per-page format)
 *
 * Client can swap ShreeRam.jpeg with any image; code adapts automatically.
 *
 * Props:
 *  portraitStyle  – style object when image is portrait/square
 *  landscapeStyle – style object when image is landscape
 *  alt            – img alt text (default "ShreeRam")
 *  Any other valid <img> props (className, onClick, onDoubleClick, …) are forwarded.
 */
const ShreeRamImage = ({
  portraitStyle = {},
  landscapeStyle = {},
  alt = 'ShreeRam',
  ...rest
}) => {
  const [isLandscape, setIsLandscape] = useState(false)

  const handleLoad = e => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setIsLandscape(naturalWidth > naturalHeight)
  }

  return (
    <img
      src={shreeRamSrc}
      alt={alt}
      style={isLandscape ? landscapeStyle : portraitStyle}
      onLoad={handleLoad}
      {...rest}
    />
  )
}

export default ShreeRamImage
