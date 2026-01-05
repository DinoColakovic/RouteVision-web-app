// pages/ture.tsx or app/.../TurePage.tsx (client component) - replace your current file
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Search, Calendar, User, Truck } from "lucide-react"
import { useRouter } from "next/navigation"

interface Tura {
  id: number
  broj_ture: string
  vozac_id: number
  vozac_ime: string
  vozac_prezime: string
  kamion_id: number
  kamion_tablica: string
  kamion_model: string
  narudzba_id: number
  narudzba_broj: string
  klijent_naziv: string
  datum_pocetka: string
  datum_kraja?: string
  status: string
  napomena?: string
}

interface Vozac {
  id: number
  ime: string
  prezime: string
}

interface Kamion {
  id: number
  registarska_tablica: string
  model: string
}

interface Narudzba {
  id: number
  broj_narudzbe: string
  klijent_naziv: string
}

type UserInfo = { id: number; role: "admin" | "vozac" }

function handleDelete() {

}

export default function TurePage() {
  const router = useRouter()
  const [ture, setTure] = useState<Tura[]>([])
  const [vozaci, setVozaci] = useState<Vozac[]>([])
  const [kamioni, setKamioni] = useState<Kamion[]>([])
  const [narudzbe, setNarudzbe] = useState<Narudzba[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTura, setCurrentTura] = useState<Tura | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("sve")
  //const [user, setUser] = useState<UserInfo | null>(null)
// add near other useState declarations
  const [user, setUser] = useState<UserInfo | null>(null)
  const [userLoaded, setUserLoaded] = useState(false) // NEW

  const [formData, setFormData] = useState({
    broj_ture: "",
    vozac_id: "",
    kamion_id: "",
    narudzba_id: "",
    datum_pocetka: "",
    datum_kraja: "",
    status: "U toku",
    napomena: "",
  })

  useEffect(() => {
    checkAuth()
    fetchTure()
  }, [])

  // fetch vozaci only for admin, but kamioni/narudzbe for everyone
  useEffect(() => {
    if (user?.role === "admin") {
      fetchVozaci()
    }
    if (user) {
      fetchKamioni()
      fetchNarudzbe()
    }
  }, [user])


  // --- NEW useEffect: fetch lists once the user is known ---
  useEffect(() => {
    // only run after we tried to load the user
    if (!userLoaded) return

    // Always fetch vehicles and orders for both roles (driver needs these)
    fetchKamioni()
    fetchNarudzbe()

    // fetch vozaci only for admin (unchanged)
    if (user?.role === "admin") {
      fetchVozaci()
    }
  }, [userLoaded, user?.role])

// Replace your existing checkAuth with this (or ensure it sets setUserLoaded(true) when done)
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" })
      if (!res.ok) {
        router.push("/login")
        return
      }
      const data = await res.json()
      setUser({ id: data.user.id, role: data.user.role })
    } catch (err) {
      console.error("checkAuth error:", err)
      router.push("/login")
    } finally {
      setUserLoaded(true)
    }
  }


  const fetchTure = async () => {
    try {
      const response = await fetch("/api/ture")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTure(data.data)
        }
      }
    } catch (error) {
      console.error("Greška pri učitavanju tura:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVozaci = async () => {
    try {
      const res = await fetch("/api/osoblje?tip=vozac", { credentials: "same-origin" })
      console.log("fetchVozaci status:", res.status)
      const payload = await res.json().catch(() => null)
      console.log("fetchVozaci payload:", payload)
      if (res.ok && payload?.success) {
        setVozaci(payload.data)
      } else {
        console.warn("Failed to load vozaci. Server returned:", payload)
        setVozaci([])
      }
    } catch (err) {
      console.error("fetchVozaci error:", err)
      setVozaci([])
    }
  }

// --- Replace fetchKamioni with this ---
  const fetchKamioni = async () => {
    try {
      const res = await fetch("/api/vozni-park", { credentials: "same-origin" })
      console.log("fetchKamioni status:", res.status)
      const payload = await res.json().catch(() => null)
      console.log("fetchKamioni payload:", payload)
      if (res.ok && payload?.success) {
        setKamioni(payload.data)
      } else {
        // keep existing state but log for debugging
        console.warn("Failed to load kamioni (vehicles). Server returned:", payload)
        setKamioni([]) // explicit empty so selects render properly
      }
    } catch (err) {
      console.error("Error fetching kamioni:", err)
      setKamioni([])
    }
  }

// --- Replace fetchNarudzbe with this ---
  const fetchNarudzbe = async () => {
    try {
      const res = await fetch("/api/narudzbe", { credentials: "same-origin" })
      console.log("fetchNarudzbe status:", res.status)
      const payload = await res.json().catch(() => null)
      console.log("fetchNarudzbe payload:", payload)
      if (res.ok && payload?.success) {
        // optionally filter to show only "Novo" orders for drivers if that's desired:
        // const filtered = user?.role === "vozac" ? payload.data.filter((n:any)=> n.status === "Novo") : payload.data
        setNarudzbe(payload.data)
      } else {
        console.warn("Failed to load narudzbe (orders). Server returned:", payload)
        setNarudzbe([])
      }
    } catch (err) {
      console.error("Error fetching narudzbe:", err)
      setNarudzbe([])
    }
  }

  const handleOpenDialog = (tura?: Tura) => {
    try {
      // guard: require user to be loaded
      if (!userLoaded) {
        console.warn("Tried to open dialog before user was loaded; ignoring.")
        return
      }

      // make sure user exists (should be true if userLoaded)
      if (!user) {
        console.error("User is not available despite userLoaded == true")
        alert("Greška: korisnik nije učitan. Pokušajte osvježiti stranicu.")
        return
      }

      if (tura) {
        setCurrentTura(tura)
        setFormData({
          broj_ture: tura.broj_ture,
          vozac_id: tura.vozac_id.toString(),
          kamion_id: tura.kamion_id.toString(),
          narudzba_id: tura.narudzba_id.toString(),
          datum_pocetka: tura.datum_pocetka.split("T")[0],
          datum_kraja: tura.datum_kraja ? tura.datum_kraja.split("T")[0] : "",
          status: tura.status,
          napomena: tura.napomena || "",
        })
      } else {
        // New tura: prefill vozac only if logged user is a driver
        setCurrentTura(null)
        setFormData({
          broj_ture: "",
          vozac_id: user.role === "vozac" ? String(user.id) : "",
          kamion_id: "",
          narudzba_id: "",
          datum_pocetka: "",
          datum_kraja: "",
          status: "U toku",
          napomena: "",
        })
      }

      setIsDialogOpen(true)
    } catch (err) {
      console.error("handleOpenDialog error:", err)
      alert("Greška pri otvaranju forme. Provjerite konzolu za detalje.")
    }
  }


// replace your existing handleSubmit with this
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // client-side validation: required fields differ slightly for admin vs vozac
      const requiredForAll = ["broj_ture", "kamion_id", "narudzba_id", "datum_pocetka"]
      for (const key of requiredForAll) {
        // @ts-ignore
        if (!formData[key]) {
          alert("Popunite sva obavezna polja (Broj ture, Kamion, Narudžba, Datum početka).")
          return
        }
      }

      // build payload deterministically — DO NOT rely on setState right before submit
      const payload: any = {
        broj_ture: formData.broj_ture,
        kamion_id: formData.kamion_id ? Number(formData.kamion_id) : undefined,
        narudzba_id: formData.narudzba_id ? Number(formData.narudzba_id) : undefined,
        datum_pocetka: formData.datum_pocetka,
        datum_kraja: formData.datum_kraja || null,
        status: formData.status,
        napomena: formData.napomena || null,
      }

      // If the logged user is a driver, force vozac_id = user.id (server also enforces)
      if (user?.role === "vozac") {
        payload.vozac_id = user.id
      } else {
        // admin must provide a vozac_id via the Select
        if (!formData.vozac_id) {
          alert("Odaberite vozača.")
          return
        }
        payload.vozac_id = Number(formData.vozac_id)
      }

      const url = currentTura ? `/api/ture/${currentTura.id}` : "/api/ture"
      const method = currentTura ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (response.ok) {
        setIsDialogOpen(false)
        fetchTure()
      } else {
        // show server error message — helpful for debugging
        alert(result?.message || "Greška pri spremanju ture")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri spremanju ture")
    }
  }

  const filteredTure = ture.filter((tura) => {
    const matchesSearch =
        tura.broj_ture.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tura.vozac_ime.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tura.vozac_prezime.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tura.kamion_tablica || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tura.narudzba_broj || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tura.klijent_naziv || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = activeTab === "sve" || tura.status === activeTab

    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "U toku":
        return <Badge className="bg-blue-500">{status}</Badge>
      case "Završena":
        return <Badge className="bg-green-500">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
        <DashboardLayout>
          <div className="p-8">Učitavanje...</div>
        </DashboardLayout>
    )
  }

  return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Ture</h1>
              <p className="text-muted-foreground">Upravljanje transportnim turama</p>
            </div>
            {/* show button only after we know the user's role */}
            {userLoaded && (user?.role === "admin" || user?.role === "vozac") && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tura
                </Button>
            )}

          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Pretraži po vozaču, kamionu, narudžbi ili klijentu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="sve">Sve Ture</TabsTrigger>
              <TabsTrigger value="U toku">U Toku</TabsTrigger>
              <TabsTrigger value="Završena">Završene</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="grid gap-4">
                {filteredTure.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">Nema pronađenih tura</CardContent>
                    </Card>
                ) : (
                    filteredTure.map((tura) => (
                        <Card key={tura.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <CardTitle className="text-xl">{tura.narudzba_broj}</CardTitle>
                                <CardDescription>
                                  Broj ture: {tura.broj_ture} • Klijent: {tura.klijent_naziv}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                {getStatusBadge(tura.status)}
                                {user?.role === "admin" && (
                                    <>
                                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(tura)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setDeleteId(tura.id)
                                            setIsDeleteDialogOpen(true)
                                          }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Vozač</p>
                                  <p className="font-medium">
                                    {tura.vozac_ime} {tura.vozac_prezime}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Kamion</p>
                                  <p className="font-medium">{tura.kamion_tablica}</p>
                                  <p className="text-sm text-muted-foreground">{tura.kamion_model}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Datum početka</p>
                                  <p className="font-medium">{new Date(tura.datum_pocetka).toLocaleDateString("bs-BA")}</p>
                                </div>
                              </div>
                              {tura.datum_kraja && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm text-muted-foreground">Datum završetka</p>
                                      <p className="font-medium">
                                        {new Date(tura.datum_kraja).toLocaleDateString("bs-BA")}
                                      </p>
                                    </div>
                                  </div>
                              )}
                            </div>
                            {tura.napomena && (
                                <div className="mt-4 p-4 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">Napomena:</p>
                                  <p className="text-sm">{tura.napomena}</p>
                                </div>
                            )}
                          </CardContent>
                        </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Dialog za kreiranje/ažuriranje ture */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{currentTura ? "Ažuriraj Turu" : "Nova Tura"}</DialogTitle>
                <DialogDescription>
                  {currentTura ? "Ažurirajte informacije o turi" : "Unesite informacije za novu turu"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  {/* Admin sees full form including choosing vozac */}
                  {user?.role === "admin" ? (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="broj_ture">Broj ture *</Label>
                          <Input
                              id="broj_ture"
                              value={formData.broj_ture}
                              onChange={(e) => setFormData({ ...formData, broj_ture: e.target.value })}
                              placeholder="TUR-2024-001"
                              required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="vozac_id">Vozač *</Label>
                          <Select
                              value={formData.vozac_id}
                              onValueChange={(value) => setFormData({ ...formData, vozac_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Odaberite vozača" />
                            </SelectTrigger>
                            <SelectContent>
                              {vozaci.map((vozac) => (
                                  <SelectItem key={vozac.id} value={vozac.id.toString()}>
                                    {vozac.ime} {vozac.prezime}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="kamion_id">Kamion *</Label>
                          <Select
                              value={formData.kamion_id}
                              onValueChange={(value) => setFormData({ ...formData, kamion_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Odaberite kamion" />
                            </SelectTrigger>
                            <SelectContent>
                              {kamioni.map((kamion) => (
                                  <SelectItem key={kamion.id} value={kamion.id.toString()}>
                                    {kamion.registarska_tablica} - {kamion.model}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="narudzba_id">Narudžba *</Label>
                          <Select
                              value={formData.narudzba_id}
                              onValueChange={(value) => setFormData({ ...formData, narudzba_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Odaberite narudzbu" />
                            </SelectTrigger>
                            <SelectContent>
                              {narudzbe.map((narudzba) => (
                                  <SelectItem key={narudzba.id} value={narudzba.id.toString()}>
                                    {narudzba.broj_narudzbe} - {narudzba.klijent_naziv}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="datum_pocetka">Datum Početka *</Label>
                            <Input
                                id="datum_pocetka"
                                type="date"
                                value={formData.datum_pocetka}
                                onChange={(e) => setFormData({ ...formData, datum_pocetka: e.target.value })}
                                required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="datum_kraja">Datum Završetka</Label>
                            <Input
                                id="datum_kraja"
                                type="date"
                                value={formData.datum_kraja}
                                onChange={(e) => setFormData({ ...formData, datum_kraja: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                  ) : null}

                  {/* Vozac (driver) form: cannot pick vozac; vozac_id is automatically their id */}
                  {user?.role === "vozac" && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="broj_ture">Broj ture *</Label>
                          <Input
                              id="broj_ture"
                              value={formData.broj_ture}
                              onChange={(e) => setFormData({ ...formData, broj_ture: e.target.value })}
                              placeholder="TUR-2024-001"
                              required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="kamion_id">Kamion *</Label>
                          <Select
                              value={formData.kamion_id}
                              onValueChange={(value) => setFormData({ ...formData, kamion_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Odaberite kamion" />
                            </SelectTrigger>
                            <SelectContent>
                              {kamioni.map((kamion) => (
                                  <SelectItem key={kamion.id} value={kamion.id.toString()}>
                                    {kamion.registarska_tablica} - {kamion.model}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="narudzba_id">Narudžba *</Label>
                          <Select
                              value={formData.narudzba_id}
                              onValueChange={(value) => setFormData({ ...formData, narudzba_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Odaberite narudzbu" />
                            </SelectTrigger>
                            <SelectContent>
                              {narudzbe.map((narudzba) => (
                                  <SelectItem key={narudzba.id} value={narudzba.id.toString()}>
                                    {narudzba.broj_narudzbe} - {narudzba.klijent_naziv}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="datum_pocetka">Datum Početka *</Label>
                            <Input
                                id="datum_pocetka"
                                type="date"
                                value={formData.datum_pocetka}
                                onChange={(e) => setFormData({ ...formData, datum_pocetka: e.target.value })}
                                required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="datum_kraja">Datum Završetka</Label>
                            <Input
                                id="datum_kraja"
                                type="date"
                                value={formData.datum_kraja}
                                onChange={(e) => setFormData({ ...formData, datum_kraja: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="U toku">U toku</SelectItem>
                        <SelectItem value="Završena">Završena</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="napomena">Napomena</Label>
                    <Textarea
                        id="napomena"
                        value={formData.napomena}
                        onChange={(e) => setFormData({ ...formData, napomena: e.target.value })}
                        placeholder="Dodatne informacije..."
                        rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Odustani
                  </Button>

                  {/* Compute simple "is valid" so we disable the button until basics are filled */}
                  <Button
                      type="submit"
                      disabled={
                          !formData.broj_ture ||
                          !formData.kamion_id ||
                          !formData.narudzba_id ||
                          !formData.datum_pocetka ||
                          (user?.role !== "vozac" && !formData.vozac_id) // admin must select vozac
                      }
                  >
                    {currentTura ? "Ažuriraj" : "Kreiraj"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog za potvrdu brisanja */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Potvrda Brisanja</DialogTitle>
                <DialogDescription>
                  Da li ste sigurni da želite obrisati ovu turu? Ova akcija se ne može poništiti.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Odustani
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Obriši
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
  )
}
