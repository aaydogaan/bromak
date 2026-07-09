"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calculator } from "lucide-react"

const VAT_RATE = 0.20
const CASHOUT_RATE = 0.0269

const METHODS = [
  { name: "QR", rate: 0 },
  { name: "Mail Order", rate: 0.0069 },
  { name: "Tek Çekim", rate: 0 },
  { name: "2 Taksit", rate: 0.0419 },
  { name: "3 Taksit", rate: 0.0599 },
  { name: "4 Taksit", rate: 0.0799 },
  { name: "6 Taksit", rate: 0.1169 },
  { name: "9 Taksit", rate: 0.1719 },
  { name: "12 Taksit", rate: 0.2269 }
]

function money(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(n) ? n : 0)
}

function pct(n: number) {
  return (n * 100).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + "%"
}

export function TahsilatHesaplamaWidget() {
  const [baseInput, setBaseInput] = useState<string>("")
  const [cashInput, setCashInput] = useState<string>("")

  const {
    vat,
    total,
    cash,
    remain,
    rows
  } = useMemo(() => {
    const base = Math.max(0, Number(baseInput) || 0)
    const vatCalc = base * VAT_RATE
    const totalCalc = base + vatCalc
    const cashCalc = Math.min(Math.max(0, Number(cashInput) || 0), totalCalc)
    const remainCalc = Math.max(0, totalCalc - cashCalc)

    const calculatedRows = METHODS.map((method) => {
      const totalRate = method.rate + CASHOUT_RATE
      const allCardTotal = totalCalc * (1 + totalRate)
      const cardCharge = remainCalc * (1 + totalRate)
      const cashPlusCardTotal = cashCalc + cardCharge
      const difference = allCardTotal - cashPlusCardTotal

      return {
        ...method,
        allCardTotal,
        cashPlusCardTotal,
        cardCharge,
        difference
      }
    })

    return {
      vat: vatCalc,
      total: totalCalc,
      cash: cashCalc,
      remain: remainCalc,
      rows: calculatedRows
    }
  }, [baseInput, cashInput])

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Tahsilat Hesaplama
        </CardTitle>
        <CardDescription>
          Hizmet bedelini KDV hariç girin. Nakit tutarı değiştikçe tüm ödeme seçenekleri otomatik güncellenir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="base">KDV Hariç Hizmet Bedeli (₺)</Label>
            <Input
              id="base"
              type="number"
              min="0"
              step="100"
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash">Nakit / Havale Ödeme Tutarı (₺)</Label>
            <Input
              id="cash"
              type="number"
              min="0"
              step="100"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">KDV %20</div>
            <div className="mt-1 text-lg font-semibold">{money(vat)}</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">KDV Dahil Ana Tutar</div>
            <div className="mt-1 text-lg font-semibold">{money(total)}</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">Nakit / Havale</div>
            <div className="mt-1 text-lg font-semibold">{money(cash)}</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">Kartla Kalan Net Tutar</div>
            <div className="mt-1 text-lg font-semibold">{money(remain)}</div>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="whitespace-nowrap">Ödeme Seçeneği</TableHead>
                <TableHead className="text-right whitespace-nowrap">Komisyon</TableHead>
                <TableHead className="text-right whitespace-nowrap">Nakde Çevirme</TableHead>
                <TableHead className="text-right whitespace-nowrap">Tamamı Kartla</TableHead>
                <TableHead className="text-right whitespace-nowrap">Nakit + Kart Toplamı</TableHead>
                <TableHead className="text-right whitespace-nowrap">Karttan Çekilecek</TableHead>
                <TableHead className="text-right whitespace-nowrap">Fiyat Farkı</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                  <TableCell className="text-right">{pct(row.rate)}</TableCell>
                  <TableCell className="text-right">{pct(CASHOUT_RATE)}</TableCell>
                  <TableCell className="text-right font-bold">{money(row.allCardTotal)}</TableCell>
                  <TableCell className="text-right font-bold">{money(row.cashPlusCardTotal)}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20 whitespace-nowrap dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20">
                      {money(row.cardCharge)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20 whitespace-nowrap dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
                      {money(row.difference)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50 leading-relaxed">
          <strong>Formül:</strong> Karttan çekilecek tutar = Kartta kalan tutar × (1 + ödeme komisyonu + %2,69). <br />
          Fiyat farkı, müşterinin tamamını kartla ödemesi yerine bir kısmını nakit/havale vermesiyle toplam ödemede oluşan düşüşü gösterir.
        </div>
      </CardContent>
    </Card>
  )
}
