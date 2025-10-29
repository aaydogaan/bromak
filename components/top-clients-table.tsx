import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Money from "@/components/money"

type ClientRow = { name: string; projects: number; revenue: number; initials?: string }

const fallback: ClientRow[] = [
  { name: "TechCorp A.Ş.", projects: 5, revenue: 142000, initials: "TC" },
  { name: "Ahmet Yılmaz", projects: 3, revenue: 98000, initials: "AY" },
  { name: "Fashion Boutique", projects: 4, revenue: 86000, initials: "FB" },
  { name: "Lezzet Restaurant", projects: 2, revenue: 72000, initials: "LR" },
  { name: "Zeynep Demir", projects: 3, revenue: 65000, initials: "ZD" },
]

export function TopClientsTable({ data }: { data?: ClientRow[] }) {
  const rows = (data && data.length ? data : fallback)
  const initialsOf = (name: string): string => {
    const parts = (name || '').trim().split(/\s+/)
    if (parts.length === 1) return (parts[0][0] || '').toUpperCase()
    return ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase()
  }
  const tl = (n: number) => `₺${(n || 0).toLocaleString('tr-TR')}`
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle>En İyi Müşteriler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((client, index) => (
            <div key={index} className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">{client.initials || initialsOf(client.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{client.name}</p>
                {client.projects > 0 && (
                  <p className="text-xs text-muted-foreground">{client.projects} proje</p>
                )}
              </div>
              <div className="text-sm font-medium"><Money value={tl(client.revenue)} /></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
