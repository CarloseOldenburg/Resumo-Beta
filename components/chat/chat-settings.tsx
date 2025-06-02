"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Settings } from "lucide-react"

interface ChatSettingsProps {
  onSettingsChange: (settings: {
    maxMessages: number
    persistChat: boolean
  }) => void
  defaultMaxMessages?: number
  defaultPersistChat?: boolean
}

export function ChatSettings({
  onSettingsChange,
  defaultMaxMessages = 10,
  defaultPersistChat = true,
}: ChatSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [maxMessages, setMaxMessages] = useLocalStorage("chat-max-messages", defaultMaxMessages)
  const [persistChat, setPersistChat] = useLocalStorage("chat-persist", defaultPersistChat)

  const handleSave = () => {
    onSettingsChange({ maxMessages, persistChat })
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => setIsOpen(true)}>
        <Settings className="h-4 w-4" />
        <span>Configurações</span>
      </Button>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-medium">Configurações do Chat</h3>

      <div className="space-y-2">
        <Label htmlFor="max-messages">Máximo de mensagens</Label>
        <Input
          id="max-messages"
          type="number"
          min="5"
          max="50"
          value={maxMessages}
          onChange={(e) => setMaxMessages(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Limitar o número de mensagens melhora o desempenho. Recomendado: 10-20 mensagens.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="persist-chat">Salvar conversa</Label>
          <p className="text-xs text-muted-foreground">Mantém o histórico de chat entre sessões</p>
        </div>
        <Switch id="persist-chat" checked={persistChat} onCheckedChange={setPersistChat} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>Salvar</Button>
      </div>
    </div>
  )
}
