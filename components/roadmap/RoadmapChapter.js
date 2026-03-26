'use client'

import { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RoadmapNode from './RoadmapNode'
import RoadmapConnector from './RoadmapConnector'
import NodeModal from './NodeModal'

export default function RoadmapChapter({ chapter, nodes, progressMap, chapterIndex, previousChapterComplete }) {
  const [activeNode, setActiveNode] = useState(null)

  const isUnlocked = chapterIndex === 0 || previousChapterComplete

  // A node is accessible if all previous nodes in this chapter are completed
  function isNodeActive(nodeIndex) {
    if (!isUnlocked) return false
    if (nodeIndex === 0) return true
    for (let i = 0; i < nodeIndex; i++) {
      if (!progressMap[nodes[i].id]?.completed) return false
    }
    return true
  }

  const completedCount = nodes.filter((n) => progressMap[n.id]?.completed).length

  // Zigzag positions (applied to each node)
  const positions = ['center', 'right', 'center', 'left', 'center']

  return (
    <div className="mb-4">
      {/* ── Nodes — flex-col-reverse so node[0] is at visual bottom ─────── */}
      <div className="flex flex-col-reverse items-center px-6">
        {nodes.map((node, idx) => {
          const pos = positions[idx % positions.length]
          const active = isNodeActive(idx)
          const prog = progressMap[node.id]

          return (
            <Fragment key={node.id}>
              {/* Connector above this node (towards next node upward) */}
              {idx < nodes.length - 1 && (
                <div className="flex justify-center w-full">
                  <RoadmapConnector completed={prog?.completed} />
                </div>
              )}

              {/* Node — offset left/center/right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: chapterIndex * 0.1 + idx * 0.08, type: 'spring', stiffness: 200 }}
                className={[
                  'flex w-full',
                  pos === 'left'  ? 'justify-start pl-10' :
                  pos === 'right' ? 'justify-end pr-10'   : 'justify-center',
                ].join(' ')}
              >
                <RoadmapNode
                  node={node}
                  progress={prog}
                  isActive={active}
                  onClick={() => setActiveNode(node)}
                />
              </motion.div>
            </Fragment>
          )
        })}
      </div>

      {/* ── Chapter header — sits below the nodes (user sees this first when scrolling up) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: chapterIndex * 0.1 }}
        className="flex items-center gap-3 mt-6 mb-2 px-6"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0"
          style={{ backgroundColor: chapter.color + '22', color: chapter.color }}
          aria-hidden="true"
        >
          {chapter.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Kapitel {chapterIndex + 1}
            </span>
            {!isUnlocked && (
              <span className="text-xs bg-surface-2 text-text-muted px-2 py-0.5 rounded-full">
                🔒 Låst
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-text">{chapter.title}</h2>
          <p className="text-xs text-text-muted">
            {completedCount}/{nodes.length} avklarat
          </p>
        </div>
      </motion.div>

      {/* Divider between chapters */}
      <div className="mx-6 border-t border-border/60 mt-4" aria-hidden="true" />

      {/* Node modal */}
      <AnimatePresence>
        {activeNode && (
          <NodeModal
            node={activeNode}
            progress={progressMap[activeNode.id]}
            onClose={() => setActiveNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
