/** Private-use markers — unlikely in normal lesson text; stripped before paragraph pass. */
const TBL_START = '\uFFF0'
const TABLE_PH = (i) => `${TBL_START}TBL${i}${TBL_START}`

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isSeparatorRow(cells) {
  return cells.every((c) => /^:?\s*-{2,}\s*:?$/.test(c.replace(/\s/g, '')))
}

/** GitHub-style row: | a | b | or | a | b (no trailing pipe) */
export function splitPipeRow(line) {
  const t = line.trim()
  if (!t.startsWith('|')) return null
  const inner = t.endsWith('|') ? t.slice(1, -1) : t.slice(1)
  const cells = inner.split('|').map((c) => c.trim())
  return cells.length >= 2 ? cells : null
}

export function splitTsvRow(line) {
  if (!line.includes('\t')) return null
  const cells = line.split('\t').map((c) => c.trim())
  return cells.length >= 2 ? cells : null
}

function rowsToHtml(rows) {
  if (rows.length === 0) return ''
  const hasHeader = rows.length >= 2
  const head = hasHeader
    ? `<thead><tr>${rows[0]
        .map(
          (c) =>
            `<th class="border border-border px-3 py-2 text-left font-semibold bg-surface-2">${escapeHtml(c)}</th>`
        )
        .join('')}</tr></thead>`
    : ''
  const bodyRows = hasHeader ? rows.slice(1) : rows
  const body = `<tbody>${bodyRows
    .map(
      (cells) =>
        `<tr>${cells.map((c) => `<td class="border border-border px-3 py-2">${escapeHtml(c)}</td>`).join('')}</tr>`
    )
    .join('')}</tbody>`
  return `<table class="w-full border-collapse my-4 text-sm">${head}${body}</table>`
}

/**
 * :::table3
 * cell cell cell
 * :::
 * (lines are read row-wise: col1, col2, col3, next row…)
 */
function extractFencedColumnTables(md, tables) {
  return md.replace(
    /(^|\r?\n):::\s*table\s*(\d+)\s*\r?\n([\s\S]*?)\r?\n:::\s*(?=\r?\n|$)/g,
    (full, lead, colsStr, body) => {
      const n = Number(colsStr)
      const lines = body.split(/\r?\n/).map((l) => l.trim())
      const nonempty = lines.filter(Boolean)
      if (n < 2 || n > 12 || nonempty.length < n || nonempty.length % n !== 0) return full
      const rows = []
      for (let i = 0; i < nonempty.length; i += n) {
        rows.push(nonempty.slice(i, i + n))
      }
      const idx = tables.length
      tables.push(rowsToHtml(rows))
      return `${lead}${TABLE_PH(idx)}`
    }
  )
}

/**
 * Consecutive tab-separated or pipe-markdown rows (optional GFM --- separator).
 * Appends HTML to `tables` and returns text with TABLE_PH placeholders.
 */
export function extractTableBlocks(md, tables) {
  const lines = md.split(/\r?\n/)
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      out.push(line)
      i++
      continue
    }

    const pipe = splitPipeRow(line)
    const tsv = !pipe ? splitTsvRow(line) : null
    if (!pipe && !tsv) {
      out.push(line)
      i++
      continue
    }

    const mode = pipe ? 'pipe' : 'tsv'
    const rows = []
    let j = i

    while (j < lines.length) {
      const L = lines[j]
      if (L.trim() === '') break

      if (mode === 'pipe') {
        const c = splitPipeRow(L)
        if (c && isSeparatorRow(c)) {
          j++
          continue
        }
        if (!c) break
        rows.push(c)
      } else {
        const c = splitTsvRow(L)
        if (!c) break
        rows.push(c)
      }
      j++
    }

    if (rows.length >= 1) {
      const idx = tables.length
      tables.push(rowsToHtml(rows))
      out.push(TABLE_PH(idx))
      i = j
      continue
    }

    out.push(line)
    i++
  }

  return out.join('\n')
}

export function injectTablePlaceholders(html, tables) {
  return html.replace(new RegExp(`${TBL_START}TBL(\\d+)${TBL_START}`, 'g'), (_, id) => {
    return tables[Number(id)] ?? ''
  })
}

/**
 * Full pipeline fragment: fenced column tables, then pipe/TSV blocks.
 * @param {string} md
 * @returns {{ text: string, tables: string[] }}
 */
export function preprocessMarkdownTables(md) {
  const tables = []
  let text = extractFencedColumnTables(md, tables)
  text = extractTableBlocks(text, tables)
  return { text, tables }
}
