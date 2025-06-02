"use client"

import { useState } from "react"
import { OptimizedChat } from "@/components/chat/optimized-chat"
import { ChatSettings } from "@/components/chat/chat-settings"

export default function ChatPage() {
  const [settings, setSettings] = useState({
    maxMessages: 10,
    persistChat: true,
  })

  return (
    <div className="container mx-auto py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat Otimizado</h1>
        <ChatSettings
          onSettingsChange={setSettings}
          defaultMaxMessages={settings.maxMessages}
          defaultPersistChat={settings.persistChat}
        />
      </div>

      <OptimizedChat maxMessages={settings.maxMessages} persistChat={settings.persistChat} chatId="resumo-beta-main" />

      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="font-medium mb-2">Sobre a Limpeza Automática</h3>
        <p className="text-sm text-muted-foreground">
          Este chat foi otimizado para melhor desempenho. Quando o número de mensagens exceder o limite configurado (
          {settings.maxMessages}), as mensagens mais antigas serão automaticamente removidas. Você também pode limpar
          manualmente o chat usando o botão de lixeira.
        </p>
      </div>
    </div>
  )
}
