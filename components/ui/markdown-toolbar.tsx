"use client"

import { Button } from "@/components/ui/button"
import { Bold, Italic, Link, List, CheckSquare, Heading2, Quote, Code } from "lucide-react"

interface MarkdownToolbarProps {
  onInsert: (text: string) => void
}

export default function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const insertMarkdown = (before: string, after = "", placeholder = "") => {
    const text = placeholder ? `${before}${placeholder}${after}` : before
    onInsert(text)
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 rounded-t-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("**", "**", "texto em negrito")}
        title="Negrito"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("*", "*", "texto em itálico")}
        title="Itálico"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("## ", "", "Título")}
        title="Título"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("- [ ] ", "", "Item da checklist")}
        title="Checkbox"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("- ", "", "Item da lista")}
        title="Lista"
      >
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

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("> ", "", "citação")}
        title="Citação"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={() => insertMarkdown("`", "`", "código")} title="Código">
        <Code className="h-4 w-4" />
      </Button>
    </div>
  )
}
