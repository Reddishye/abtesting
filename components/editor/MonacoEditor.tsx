'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
})

interface MonacoEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  height?: string
}

export function MonacoEditor({
  value,
  onChange,
  readOnly = false,
  height = '100%',
}: MonacoEditorProps) {
  return (
    <Editor
      height={height}
      defaultLanguage="javascript"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange?.(v ?? '')}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'var(--font-geist-mono), "Fira Code", monospace',
        readOnly,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        lineNumbers: 'on',
        renderLineHighlight: 'gutter',
        tabSize: 2,
        automaticLayout: true,
      }}
    />
  )
}
