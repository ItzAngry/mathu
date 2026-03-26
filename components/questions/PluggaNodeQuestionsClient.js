'use client'

import { useRouter } from 'next/navigation'
import QuestionSession from '@/components/questions/QuestionSession'

export default function PluggaNodeQuestionsClient({ node }) {
  const router = useRouter()
  return (
    <QuestionSession
      node={node}
      variant="page"
      onClose={() => {
        router.push('/plugga')
        router.refresh()
      }}
    />
  )
}
