"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator, Plus, X } from "lucide-react"

interface Entry {
  id: string
  label: string
  amount: number
}

export function PercentageCalculator() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [currentAmount, setCurrentAmount] = useState<string>("")
  const [currentLabel, setCurrentLabel] = useState<string>("")

  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0)
  const percent40 = totalAmount * 0.4
  const percent60 = totalAmount * 0.6

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const addEntry = () => {
    const amount = Number.parseFloat(currentAmount)
    if (amount && amount > 0) {
      const newEntry: Entry = {
        id: Date.now().toString(),
        label: currentLabel || `İşletme ${entries.length + 1}`,
        amount: amount,
      }
      setEntries([...entries, newEntry])
      setCurrentAmount("")
      setCurrentLabel("")
    }
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addEntry()
    }
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Yüzde Hesaplama Aracı
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">İşletme Adı</Label>
            <Input
              id="label"
              type="text"
              placeholder="Örn: Tesla"
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Tutar (₺)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Örn: 100.000₺"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={addEntry}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ekle
              </Button>
            </div>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="space-y-2">
            <Label>Eklenen Tutarlar</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.label}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(entry.amount)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-blue-500/5 p-4">
                <div className="text-sm text-muted-foreground">%40</div>
                <div className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(percent40)}</div>
              </div>

              <div className="rounded-lg border border-border/50 bg-purple-500/5 p-4">
                <div className="text-sm text-muted-foreground">%60</div>
                <div className="mt-2 text-2xl font-bold text-purple-600">{formatCurrency(percent60)}</div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Toplam Tutar</div>
              <div className="mt-1 text-xl font-semibold">{formatCurrency(totalAmount)}</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
