'use client'

import { useState } from 'react'
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

  // Zigzag layout: alternate left/right for visual interest
  const positions = ['center', 'right', 'center', 'left', 'center']

  return (
    <div className="mb-12">
      {/* Chapter header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: chapterIndex * 0.1 }}
        className="flex items-center gap-3 mb-8 px-6"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm"
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

      {/* Nodes in zigzag pattern */}
      <div className="flex flex-col items-center gap-0 px-6">
        {nodes.map((node, idx) => {
          const pos = positions[idx % positions.length]
          const active = isNodeActive(idx)
          const prog = progressMap[node.id]

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: chapterIndex * 0.1 + idx * 0.08, type: 'spring', stiffness: 200 }}
              className={[
                'flex flex-col items-center w-full',
                pos === 'left' && 'items-start pl-12',
                pos === 'right' && 'items-end pr-12',
              ].filter(Boolean).join(' ')}
            >
              <RoadmapNode
                node={node}
                progress={prog}
                isActive={active}
                onClick={() => setActiveNode(node)}
              />
              {idx < nodes.length - 1 && (
                <RoadmapConnector completed={prog?.completed} />
              )}
            </motion.div>
          )
        })}
      </div>

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
