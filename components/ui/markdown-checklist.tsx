"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface MarkdownChecklistProps {
  content: string
  onChange?: (newContent: string) => void
}

export default function MarkdownChecklist({ content, onChange }: MarkdownChecklistProps) {
  const [parsedContent, setParsedContent] = useState<React.ReactNode[]>([])

  useEffect(() => {
    parseMarkdown(content)
  }, [content])

  const parseMarkdown = (markdown: string) => {
    // Dividir o conteúdo em linhas
    const lines = markdown.split("\n")

    const elements = lines.map((line, index) => {
      // Verificar se é um item de checklist
      const checklistMatch = line.match(/^- \[([ x])\] (.+)$/)

      if (checklistMatch) {
        const isChecked = checklistMatch[1] === "x"
        const text = checklistMatch[2]

        return (
          <div key={index} className="flex items-start space-x-2 py-1">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleCheckboxChange(index, isChecked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={isChecked ? "line-through text-gray-500" : ""}>{text}</span>
          </div>
        )
      }

      // Verificar se é um link
      const linkMatch = line.match(/\[([^\]]+)\]$$([^)]+)$$/)
      if (linkMatch) {
        const linkText = linkMatch[1]
        const linkUrl = linkMatch[2]
        return (
          <p key={index} className="py-1">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {linkText}
            </a>
          </p>
        )
      }

      // Se não for um item de checklist nem link, renderizar como texto normal
      if (line.trim()) {
        return (
          <p key={index} className="py-1">
            {line}
          </p>
        )
      }

      // Linha vazia
      return <div key={index} className="py-1"></div>
    })

    setParsedContent(elements)
  }

  const handleCheckboxChange = (lineIndex: number, currentState: boolean) => {
    if (!onChange) return

    const lines = content.split("\n")
    const line = lines[lineIndex]

    // Substituir o estado do checkbox
    const updatedLine = currentState ? line.replace(/^- \[x\]/, "- [ ]") : line.replace(/^- \[ \]/, "- [x]")

    lines[lineIndex] = updatedLine
    const updatedContent = lines.join("\n")

    onChange(updatedContent)
  }

  return <div className="markdown-checklist space-y-1">{parsedContent}</div>
}
