import { type NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { summary, date, format: exportFormat } = body

    if (!summary) {
      return NextResponse.json({ error: "Summary is required" }, { status: 400 })
    }

    const formattedDate = format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    const fileName = `daily-summary-${date}`

    if (exportFormat === "txt") {
      // Exportar como texto
      const content = `RESUMO DAILY - ${formattedDate}\n\n${summary}`

      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}.txt"`,
        },
      })
    } else if (exportFormat === "pdf") {
      // Para PDF, vamos retornar um texto simples por enquanto
      // Em uma implementação real, usaríamos uma biblioteca como jspdf
      const content = `RESUMO DAILY - ${formattedDate}\n\n${summary}`

      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}.txt"`,
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in POST /api/export-summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
