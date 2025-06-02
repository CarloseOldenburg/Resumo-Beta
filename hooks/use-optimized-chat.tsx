"use client"

import { useEffect, useCallback } from "react"
import { useChat, type Message } from "ai/react"
import { useLocalStorage } from "./use-local-storage"

interface OptimizedChatOptions {
  apiEndpoint?: string
  maxMessages?: number
  persistChat?: boolean
  chatId?: string
}

export function useOptimizedChat({
  apiEndpoint = "/api/chat",
  maxMessages = 10,
  persistChat = false,
  chatId = "default-chat",
}: OptimizedChatOptions = {}) {
  // Use o hook padrão do AI SDK
  const chatHook = useChat({
    api: apiEndpoint,
    id: chatId,
  })

  const { messages, setMessages } = chatHook

  // Armazenamento local opcional
  const [savedMessages, setSavedMessages] = useLocalStorage<Message[]>(`chat-${chatId}`, [])

  // Carregar mensagens salvas se persistChat estiver ativado
  useEffect(() => {
    if (persistChat && savedMessages.length > 0 && messages.length === 0) {
      setMessages(savedMessages)
    }
  }, [persistChat, savedMessages, messages.length, setMessages])

  // Salvar mensagens se persistChat estiver ativado
  useEffect(() => {
    if (persistChat && messages.length > 0) {
      setSavedMessages(messages)
    }
  }, [persistChat, messages, setSavedMessages])

  // Limpar mensagens automaticamente quando exceder o limite
  useEffect(() => {
    if (messages.length > maxMessages) {
      console.log(`Limpando mensagens antigas. Mantendo apenas as últimas ${maxMessages}.`)
      setMessages(messages.slice(-maxMessages))
    }
  }, [messages, maxMessages, setMessages])

  // Função para limpar manualmente todas as mensagens
  const clearChat = useCallback(() => {
    setMessages([])
    if (persistChat) {
      setSavedMessages([])
    }
  }, [setMessages, persistChat, setSavedMessages])

  // Função para exportar o histórico de chat
  const exportChat = useCallback(() => {
    const chatData = JSON.stringify(messages, null, 2)
    const blob = new Blob([chatData], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `chat-${chatId}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [messages, chatId])

  return {
    ...chatHook,
    clearChat,
    exportChat,
    messageCount: messages.length,
    isFull: messages.length >= maxMessages,
  }
}
