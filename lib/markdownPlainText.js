/** Remove LaTeX math regions before stripping other markdown (TTS). */
function stripMathRegions(md) {
  return md
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\\\([\s\S]*?\\\)/g, ' ')
    .replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, ' ')
}

function stripFencedColumnTables(md) {
  return md.replace(/(^|\r?\n):::\s*table\s*\d+\s*\r?\n[\s\S]*?\r?\n:::\s*(?=\r?\n|$)/g, ' ')
}

/** Strip markdown to plain text for speech synthesis fallbacks. */
export function markdownToSpeechPlainText(md) {
  if (!md || typeof md !== 'string') return ''
  return stripFencedColumnTables(stripMathRegions(md))
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
