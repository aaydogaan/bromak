import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import Money from "@/components/money"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  hideable?: boolean
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, hideable }: StatCardProps) {
  return (
    <Card className="glass-effect p-6 transition-all hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {hideable ? <Money value={String(value)} /> : value}
          </p>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}>{trend}</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  )
}
