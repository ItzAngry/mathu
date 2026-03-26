'use client'

import { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RoadmapNode from './RoadmapNode'
import RoadmapConnector from './RoadmapConnector'
import NodeModal from './NodeModal'

// Zigzag positions — must match the pl/pr offsets in the render below
const POSITIONS = ['center', 'right', 'center', 'left', 'center']

export default function RoadmapChapter({ chapter, nodes, progressMap, chapterIndex, previousChapterComplete }) {
  const [activeNode, setActiveNode] = useState(null)

  const isUnlocked = chapterIndex === 0 || previousChapterComplete

  function isNodeActive(nodeIndex) {
    if (!isUnlocked) return false
    if (nodeIndex === 0) return true
    for (let i = 0; i < nodeIndex; i++) {
      if (!progressMap[nodes[i].id]?.completed) return false
    }
    return true
  }

  const completedCount = nodes.filter((n) => progressMap[n.id]?.completed).length

  return (
    <div className="mb-2">
      {/*
        flex-col-reverse: DOM order [node0, conn0, node1, conn1, ..., nodeN-1]
        renders visually as  [nodeN-1, connN-2, ..., conn0, node0]
        → node0 at visual BOTTOM (start of chapter), nodeN-1 at visual TOP
      */}
      <div className="flex flex-col-reverse px-4">
        {nodes.map((node, idx) => {
          const pos = POSITIONS[idx % POSITIONS.length]
          const nextPos = POSITIONS[(idx + 1) % POSITIONS.length]
          const active = isNodeActive(idx)
          const prog = progressMap[node.id]

          return (
            <Fragment key={node.id}>
              {/* Node — offset left/center/right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: chapterIndex * 0.1 + idx * 0.08, type: 'spring', stiffness: 200 }}
                className={[
                  'flex w-full',
                  pos === 'left'  ? 'justify-start pl-8' :
                  pos === 'right' ? 'justify-end pr-8'   : 'justify-center',
                ].join(' ')}
              >
                <RoadmapNode
                  node={node}
                  progress={prog}
                  isActive={active}
                  onClick={() => setActiveNode(node)}
                />
              </motion.div>

              {/*
                Connector placed AFTER the node in DOM.
                With flex-col-reverse, it appears ABOVE node[idx] visually,
                connecting up toward node[idx+1].
                  topPos    = position of the node ABOVE (idx+1)
                  bottomPos = position of this node (idx)
              */}
              {idx < nodes.length - 1 && (
                <RoadmapConnector
                  completed={prog?.completed}
                  topPos={nextPos}
                  bottomPos={pos}
                />
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Chapter header — sits below the nodes in the DOM so it appears at the
          bottom of each chapter section when the outer list is flex-col-reverse */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: chapterIndex * 0.1 }}
        className="flex items-center gap-3 mt-4 mb-2 px-6"
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
          <p className="text-xs text-text-muted">{completedCount}/{nodes.length} avklarat</p>
        </div>
      </motion.div>

      <div className="mx-6 border-t border-border/50 mt-2" aria-hidden="true" />

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
