import katex from 'katex'
import { injectTablePlaceholders, preprocessMarkdownTables } from '@/lib/markdownTables'

/** @param {{ displayMode: boolean, latex: string }[]} blocks */
function injectKatexHtml(html, blocks) {
  return html.replace(/<!--MATH-(\d+)-->/g, (_, id) => {
    const b = blocks[Number(id)]
    if (!b) return ''
    try {
      return katex.renderToString(b.latex, {
        displayMode: b.displayMode,
        throwOnError: false,
        strict: false,
      })
    } catch {
      return '<span class="text-danger text-sm">[Ogiltig formel]</span>'
    }
  })
}

/** Replace math with numbered HTML comments; push each piece to `blocks`. */
function extractMathSegments(md, blocks) {
  if (!md) return ''
  let s = md

  const push = (displayMode, latex) => {
    const id = blocks.length
    blocks.push({ displayMode, latex: latex.trim() })
    return `<!--MATH-${id}-->`
  }

  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => `\n\n${push(true, latex)}\n\n`)
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) => `\n\n${push(true, latex)}\n\n`)
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, latex) => push(false, latex))
  s = s.replace(/(?<!\$)\$(?!\$)((?:\\.|[^$\n])+?)\$(?!\$)/g, (_, latex) => push(false, latex))

  return s
}

function parseMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-2 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/(<li.*<\/li>\n)+/gs, (list) => `<ul class="my-2">${list}</ul>`)
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/^(?!<[hultpc])(.+)$/gm, '<p class="mb-2">$1</p>')
}

/**
 * Markdown + LaTeX → HTML for intro text nodes (client-safe string, still use sanitization if content is untrusted).
 * Delimiters: `$$…$$`, `\[…\]`, inline `$…$`, `\(…\)`.
 */
export function renderIntroMarkdownToHtml(md) {
  if (!md) return ''
  const mathBlocks = []
  const withoutMath = extractMathSegments(md, mathBlocks)
  const { text: withTablePh, tables } = preprocessMarkdownTables(withoutMath)
  let html = parseMarkdown(withTablePh)
  html = injectTablePlaceholders(html, tables)
  html = injectKatexHtml(html, mathBlocks)
  return html
}
