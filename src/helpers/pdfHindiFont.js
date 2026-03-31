/**
 * Hindi/Devanagari font support for jsPDF.
 *
 * Uses Noto Sans Devanagari (Google Fonts) which supports Hindi, Marathi,
 * Sanskrit and other Devanagari-script languages.
 *
 * Usage:
 *   import { registerHindiFont } from '../helpers/pdfHindiFont'
 *   const doc = new jsPDF(...)
 *   await registerHindiFont(doc)
 *   doc.setFont('NotoSansDevanagari')
 *   doc.text('हिन्दी टेक्स्ट', 10, 10)
 */

const FONT_URL_NORMAL =
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/static/NotoSansDevanagari-Regular.ttf'

const FONT_URL_BOLD =
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/static/NotoSansDevanagari-Bold.ttf'

const FONT_NAME = 'NotoSansDevanagari'

// In-memory cache so we only fetch once per session
let cachedNormalBase64 = null
let cachedBoldBase64 = null

async function ttfToBase64(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

/**
 * Fetches the Noto Sans Devanagari Regular + Bold fonts and registers them
 * with the given jsPDF document instance.
 *
 * @param {import('jspdf').jsPDF} doc - jsPDF document instance
 * @returns {Promise<void>}
 */
export async function registerHindiFont(doc) {
  try {
    if (!cachedNormalBase64) {
      cachedNormalBase64 = await ttfToBase64(FONT_URL_NORMAL)
    }
    if (!cachedBoldBase64) {
      cachedBoldBase64 = await ttfToBase64(FONT_URL_BOLD)
    }

    // Register normal variant
    doc.addFileToVFS(`${FONT_NAME}-normal.ttf`, cachedNormalBase64)
    doc.addFont(`${FONT_NAME}-normal.ttf`, FONT_NAME, 'normal')

    // Register true bold variant (separate Bold TTF)
    doc.addFileToVFS(`${FONT_NAME}-bold.ttf`, cachedBoldBase64)
    doc.addFont(`${FONT_NAME}-bold.ttf`, FONT_NAME, 'bold')
  } catch (err) {
    console.warn('Hindi font registration failed, falling back to default font:', err)
    // Don't throw — PDF will still generate with default font
  }
}

/**
 * Helper: sets the Hindi font on the doc if it was registered, otherwise no-op.
 * @param {import('jspdf').jsPDF} doc
 * @param {'normal'|'bold'} style
 */
export function setHindiFont(doc, style = 'normal') {
  try {
    doc.setFont(FONT_NAME, style)
  } catch (e) {
    // Font not registered, keep default
  }
}

export { FONT_NAME }
