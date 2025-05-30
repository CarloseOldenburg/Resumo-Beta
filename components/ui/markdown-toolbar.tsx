"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Bold, Italic, Link, List, CheckSquare, Heading2, Quote, Code } from "lucide-react"

interface MarkdownToolbarProps {
  onInsert?: (text: string) => void
  textareaRef?: React.RefObject<HTMLTextAreaElement>
  value?: string
  onChange?: (value: string) => void
}

export default function MarkdownToolbar({ onInsert, textareaRef, value, onChange }: MarkdownToolbarProps) {
  const insertMarkdown = (before: string, after = "", placeholder = "") => {
    // Se temos referência do textarea e funções de controle, usar o método novo
    if (textareaRef?.current && value !== undefined && onChange) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)

      let textToInsert = ""

      // Se há texto selecionado, aplicar markdown ao texto selecionado
      if (selectedText) {
        textToInsert = `${before}${selectedText}${after}`
      } else {
        // Se não há seleção, inserir apenas o markdown (com placeholder se especificado)
        textToInsert = placeholder ? `${before}${placeholder}${after}` : before
      }

      const newValue = value.substring(0, start) + textToInsert + value.substring(end)
      onChange(newValue)

      // Focar no textarea e posicionar o cursor
      setTimeout(() => {
        textarea.focus()
        if (selectedText) {
          // Se havia texto selecionado, posicionar cursor no final
          const newCursorPosition = start + textToInsert.length
          textarea.setSelectionRange(newCursorPosition, newCursorPosition)
        } else if (placeholder) {
          // Se há placeholder, selecionar o placeholder para fácil substituição
          const placeholderStart = start + before.length
          const placeholderEnd = placeholderStart + placeholder.length
          textarea.setSelectionRange(placeholderStart, placeholderEnd)
        } else {
          // Posicionar cursor após o markdown inserido
          const newCursorPosition = start + textToInsert.length
          textarea.setSelectionRange(newCursorPosition, newCursorPosition)
        }
      }, 0)
    } else if (onInsert) {
      // Fallback para o método antigo se onInsert estiver disponível
      const text = placeholder ? `${before}${placeholder}${after}` : before
      onInsert(text)
    } else {
      // Se não há nenhuma função disponível, não fazer nada
      console.warn("MarkdownToolbar: Nem onInsert nem onChange/textareaRef foram fornecidos")
    }
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800 rounded-t-md">
      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("**", "**")} title="Negrito">
        <Bold className="h-4 w-4" />
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("*", "*")} title="Itálico">
        <Italic className="h-4 w-4" />
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("## ")} title="Título">
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("- [ ] ")} title="Checkbox">
        <CheckSquare className="h-4 w-4" />
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("- ")} title="Lista">
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("[", "](url)", "texto do link")}
        title="Link"
      >
        <Link className="h-4 w-4" />
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("> ")} title="Citação">
        <Quote className="h-4 w-4" />
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("`", "`", "código")} title="Código">
        <Code className="h-4 w-4" />
      </Button>
    </div>
  )
}
