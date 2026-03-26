/** Unikt id i DOM för scroll / «tillbaka till lektion». */
export const PLUGGA_LESSON_ANCHOR_ID = 'plugga-lesson-anchor'

/** Delad plugga-logik (kapitel-upplåsning + «var du är»). */

export function isPrevChapterComplete(chapters, nodesByChapter, progressMap, chapterIdx) {
  if (chapterIdx === 0) return true
  const prevChapter = chapters[chapterIdx - 1]
  const prevNodes = nodesByChapter[prevChapter?.id] ?? []
  return prevNodes.every((n) => progressMap[n.id]?.completed)
}

export function isChapterUnlocked(chapters, nodesByChapter, progressMap, skippedSet, chapterIdx, chapterId) {
  if (chapterIdx === 0) return true
  if (skippedSet.has(chapterId)) return true
  return isPrevChapterComplete(chapters, nodesByChapter, progressMap, chapterIdx)
}

/** Första upplåsta kapitel som inte är helt avklarat. */
export function getProgressCurrentChapterId(chapters, nodesByChapter, progressMap, skippedSet) {
  if (!chapters?.length) return null
  for (let idx = 0; idx < chapters.length; idx++) {
    const ch = chapters[idx]
    if (!isChapterUnlocked(chapters, nodesByChapter, progressMap, skippedSet, idx, ch.id)) continue
    const nodes = nodesByChapter[ch.id] ?? []
    if (nodes.length === 0) continue
    const allDone = nodes.every((n) => progressMap[n.id]?.completed)
    if (!allDone) return ch.id
  }
  return null
}

/**
 * Var scroll / «tillbaka till lektion» ska landa: aktuellt kapitel + första ofullständiga noden
 * (eller sista noden om kapitlet är tomt / edge).
 */
export function getLessonScrollTarget(chapters, nodesByChapter, progressMap, skippedSet) {
  const list = chapters ?? []
  if (!list.length) return { chapterId: null, nodeId: null }

  const currentChapterId = getProgressCurrentChapterId(list, nodesByChapter, progressMap, skippedSet)
  const chapterId = currentChapterId ?? list[list.length - 1].id
  const nodes = nodesByChapter[chapterId] ?? []

  if (nodes.length === 0) return { chapterId, nodeId: null }

  const firstIncomplete = nodes.find((n) => !progressMap[n.id]?.completed)
  if (firstIncomplete) return { chapterId, nodeId: firstIncomplete.id }

  return { chapterId, nodeId: nodes[nodes.length - 1].id }
}

export function getProgressCurrentChapterIndex(chapters, nodesByChapter, progressMap, skippedSet) {
  const list = chapters ?? []
  const id = getProgressCurrentChapterId(list, nodesByChapter, progressMap, skippedSet)
  if (id) {
    const i = list.findIndex((c) => c.id === id)
    return i >= 0 ? i : list.length - 1
  }
  if (list.length === 0) return -1
  return list.length - 1
}
