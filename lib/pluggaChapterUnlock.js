const STORAGE_KEY = 'mathu_skipped_chapters_v1'
const JUMP_STACK_KEY = 'mathu_chapter_jump_stack_v1'

export const CHAPTER_SKIP_EVENT = 'mathu:chapterskip'
export const JUMP_STACK_EVENT = 'mathu:jumpstack'

function dispatchJumpStackEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(JUMP_STACK_EVENT))
  }
}

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

/** Stack of { chapterId, autoNodeIds } — one entry per chapter skip (for LIFO revert). */
export function getJumpStack() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(JUMP_STACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x) =>
        x &&
        typeof x.chapterId === 'string' &&
        Array.isArray(x.autoNodeIds) &&
        x.autoNodeIds.every((id) => typeof id === 'string')
    )
  } catch {
    return []
  }
}

export function pushJumpRecord(record) {
  if (typeof window === 'undefined') return
  const stack = getJumpStack()
  stack.push({ chapterId: record.chapterId, autoNodeIds: record.autoNodeIds ?? [] })
  localStorage.setItem(JUMP_STACK_KEY, JSON.stringify(stack))
  dispatchJumpStackEvent()
}

/** @returns {number} */
export function getJumpStackDepth() {
  return getJumpStack().length
}

export function removeSkippedChapterId(chapterId) {
  if (typeof window === 'undefined') return
  const ids = getSkippedChapterIds().filter((id) => id !== chapterId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event(CHAPTER_SKIP_EVENT))
}

/** Remove several chapter ids from the skip-unlock list (e.g. revert all jumps). */
export function removeSkippedChapterIds(chapterIds) {
  if (typeof window === 'undefined' || !chapterIds?.length) return
  const drop = new Set(chapterIds)
  const ids = getSkippedChapterIds().filter((id) => !drop.has(id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event(CHAPTER_SKIP_EVENT))
}

/** Replace jump stack (e.g. after popping on server success). */
export function setJumpStack(stack) {
  if (typeof window === 'undefined') return
  if (!stack.length) localStorage.removeItem(JUMP_STACK_KEY)
  else localStorage.setItem(JUMP_STACK_KEY, JSON.stringify(stack))
  dispatchJumpStackEvent()
}

/** Rensa alla kapitelhopp (sparade hopp + öppnade kapitel utan ordning). */
export function clearAllChapterSkipState() {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  localStorage.removeItem(JUMP_STACK_KEY)
  window.dispatchEvent(new Event(CHAPTER_SKIP_EVENT))
  dispatchJumpStackEvent()
}
