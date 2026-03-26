const STORAGE_KEY = 'mathu_skipped_chapters_v1'

export const CHAPTER_SKIP_EVENT = 'mathu:chapterskip'

export function getSkippedChapterIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function addSkippedChapter(chapterId) {
  if (typeof window === 'undefined') return
  const ids = new Set(getSkippedChapterIds())
  ids.add(chapterId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  window.dispatchEvent(new Event(CHAPTER_SKIP_EVENT))
}
