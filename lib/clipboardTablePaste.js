/**
 * Word / Excel / Sheets often put an HTML table on the clipboard. Convert to pipe markdown for content_md.
 * Browser-only (uses DOMParser).
 */
export function clipboardHtmlToPipeMarkdown(html) {
  if (typeof window === 'undefined' || !html?.trim()) return null
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const table = doc.querySelector('table')
    if (!table) return null
    const rows = [...table.querySelectorAll('tr')]
      .map((tr) =>
        [...tr.querySelectorAll('th,td')].map((cell) => cell.textContent.replace(/\s+/g, ' ').trim())
      )
      .filter((r) => r.length > 0)
    if (rows.length === 0) return null
    const max = Math.max(...rows.map((r) => r.length))
    const normalized = rows.map((r) => {
      const copy = [...r]
      while (copy.length < max) copy.push('')
      return copy
    })
    return normalized.map((r) => '| ' + r.join(' | ') + ' |').join('\n')
  } catch {
    return null
  }
}

export function insertTextAtCursor(textarea, insertion) {
  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const v = textarea.value
  textarea.value = v.slice(0, start) + insertion + v.slice(end)
  const pos = start + insertion.length
  textarea.setSelectionRange(pos, pos)
}
