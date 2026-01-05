// app/api/narudzbe/route.ts
import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface NarudbaRow extends RowDataPacket {
  id: number
  broj_narudzbe: string
  klijent_id: number
  klijent_naziv: string
  datum_narudzbe: Date
  datum_isporuke: Date
  vrsta_robe: string
  kolicina: number
  jedinica_mjere: string
  lokacija_preuzimanja: string
  lokacija_dostave: string
  napomena: string
  status: string
  aktivan: boolean
  datum_kreiranja: Date
}

// GET /api/narudzbe - admins see all, vozaci see new/relevant orders
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)

    // admin: return all active narudzbe
    if (session.role === "admin") {
      const [narudzbe] = await pool.execute<NarudbaRow[]>(
          `SELECT n.*, k.naziv_firme as klijent_naziv 
         FROM narudzba n 
         LEFT JOIN klijent k ON n.klijent_id = k.id 
         WHERE n.aktivan = TRUE
         ORDER BY n.datum_kreiranja DESC`,
      )

      return NextResponse.json({ success: true, data: narudzbe })
    }

    // vozac: return only "new" orders — match common "Novo"/"Novoprijavljena" values
    if (session.role === "vozac") {
      const [narudzbe] = await pool.execute<NarudbaRow[]>(
          `SELECT n.*, k.naziv_firme as klijent_naziv
         FROM narudzba n
         LEFT JOIN klijent k ON n.klijent_id = k.id
         WHERE n.aktivan = TRUE AND n.status LIKE '%Nov%'
         ORDER BY n.datum_kreiranja DESC`,
      )

      return NextResponse.json({ success: true, data: narudzbe })
    }

    return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
  } catch (error) {
    console.error("[narudzbe] Greška pri dohvatanju narudžbi:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
