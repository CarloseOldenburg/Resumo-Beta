"use client"
import { useOptimizedChat } from "@/hooks/use-optimized-chat"
import { Button } from "@/components/ui/button"
import { Trash2, Download, Send, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OptimizedChatProps {
  apiEndpoint?: string
  maxMessages?: number
  persistChat?: boolean
  chatId?: string
  placeholder?: string
}

export function OptimizedChat({
  apiEndpoint = "/api/chat",
  maxMessages = 10,
  persistChat = true,
  chatId = "resumo-beta-chat",
  placeholder = "Digite sua mensagem...",
}: OptimizedChatProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, clearChat, exportChat, messageCount, isFull } =
    useOptimizedChat({
      apiEndpoint,
      maxMessages,
      persistChat,
      chatId,
    })

  return (
    <div className="flex flex-col h-full max-h-[600px] border rounded-lg overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Chat</h3>
          <Badge variant={isFull ? "destructive" : "secondary"}>
            {messageCount}/{maxMessages} mensagens
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={exportChat} title="Exportar conversa">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={clearChat} title="Limpar conversa">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">As mensagens serão limitadas a {maxMessages} para melhor desempenho.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isFull && (
          <div className="flex items-center justify-center gap-2 p-2 text-amber-600 bg-amber-50 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Limite de mensagens atingido. Mensagens antigas serão removidas automaticamente.
            </span>
          </div>
        )}
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <input
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
