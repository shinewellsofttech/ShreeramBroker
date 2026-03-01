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

const FONT_URL =
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf'

const FONT_NAME = 'NotoSansDevanagari'

// In-memory cache so we only fetch once per session
let cachedBase64 = null

/**
 * Fetches the Noto Sans Devanagari font, converts to base64 and registers it
 * with the given jsPDF document instance. After calling this, use:
 *   doc.setFont('NotoSansDevanagari', 'normal')
 *
 * @param {import('jspdf').jsPDF} doc - jsPDF document instance
 * @returns {Promise<void>}
 */
export async function registerHindiFont(doc) {
  try {
    if (!cachedBase64) {
      // Try fetching from CDN
      const response = await fetch(FONT_URL)
      if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
      }
      cachedBase64 = btoa(binary)
    }

    // Register with jsPDF (addFileToVFS + addFont)
    const fileName = `${FONT_NAME}-normal.ttf`
    doc.addFileToVFS(fileName, cachedBase64)
    doc.addFont(fileName, FONT_NAME, 'normal')

    // Also register as bold (same file, jsPDF will use it)
    const boldFileName = `${FONT_NAME}-bold.ttf`
    doc.addFileToVFS(boldFileName, cachedBase64)
    doc.addFont(boldFileName, FONT_NAME, 'bold')
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
