"use client"

import { useState, useEffect, type FormEvent } from "react"
import type { ClientTag } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ClientTagManager() {
  const [tags, setTags] = useState<ClientTag[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentTag, setCurrentTag] = useState<Partial<ClientTag> | null>(null)
  const [tagName, setTagName] = useState("")
  const [tagColor, setTagColor] = useState("#3B82F6") // Default blue
  const [tagDescription, setTagDescription] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/client-tags")
      if (!response.ok) throw new Error("Failed to fetch tags")
      const data = await response.json()
      setTags(data)
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar as tags de cliente.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentTag(null)
    setTagName("")
    setTagColor("#3B82F6")
    setTagDescription("")
  }

  const handleOpenDialog = (tag?: ClientTag) => {
    if (tag) {
      setCurrentTag(tag)
      setTagName(tag.name)
      setTagColor(tag.color || "#3B82F6")
      setTagDescription(tag.description || "")
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!tagName.trim()) {
      toast({ title: "Erro", description: "O nome da tag é obrigatório.", variant: "destructive" })
      return
    }

    const method = currentTag?.id ? "PUT" : "POST"
    const url = currentTag?.id ? `/api/client-tags/${currentTag.id}` : "/api/client-tags"
    const body = { name: tagName, color: tagColor, description: tagDescription }

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${currentTag?.id ? "update" : "create"} tag`)
      }

      toast({ title: "Sucesso", description: `Tag ${currentTag?.id ? "atualizada" : "criada"} com sucesso.` })
      fetchTags()
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tag? Esta ação não pode ser desfeita.")) return

    try {
      const response = await fetch(`/api/client-tags/${tagId}`, { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete tag")
      }
      toast({ title: "Sucesso", description: "Tag excluída com sucesso." })
      fetchTags()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  if (loading) {
    return <p>Carregando tags...</p>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gerenciar Tags de Cliente</CardTitle>
            <CardDescription>Adicione, edite ou remova tags de cliente.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Tag
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhuma tag encontrada.
                </TableCell>
              </TableRow>
            )}
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: tag.color }}
                      title={tag.color}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>{tag.description || "-"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(tag)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentTag?.id ? "Editar Tag" : "Nova Tag de Cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Nome
                </label>
                <Input
                  id="name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="color" className="text-right">
                  Cor
                </label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  value={tagDescription}
                  onChange={(e) => setTagDescription(e.target.value)}
                  className="col-span-3"
                  rows={3}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">{currentTag?.id ? "Salvar Alterações" : "Criar Tag"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
