'use client'

import { clipboardHtmlToPipeMarkdown, insertTextAtCursor } from '@/lib/clipboardTablePaste'

export default function ContentMdTextarea({
  name,
  defaultValue,
  rows = 10,
  placeholder,
  id,
  className = '',
}) {
  function onPaste(e) {
    const html = e.clipboardData?.getData('text/html') ?? ''
    if (html && /<table[\s>]/i.test(html)) {
      const md = clipboardHtmlToPipeMarkdown(html)
      if (md) {
        e.preventDefault()
        insertTextAtCursor(e.currentTarget, `${md}\n\n`)
      }
    }
  }

  return (
    <textarea
      name={name}
      id={id}
      defaultValue={defaultValue}
      rows={rows}
      placeholder={placeholder}
      onPaste={onPaste}
      spellCheck
      className={[
        'w-full px-3 py-2.5 rounded-xl border border-border text-sm font-mono',
        'focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[200px]',
        className,
      ].join(' ')}
    />
  )
}
