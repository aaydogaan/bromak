import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Banknote, User, FileText } from "lucide-react"

interface Contract {
  id: number
  title: string
  client: string
  project: string
  amount: string
  startDate: string
  endDate: string
  status: "active" | "pending" | "completed"
  progress: number
}

interface ContractCardProps {
  contract: Contract
  onView?: () => void
  onDownload?: () => void
}

const statusConfig = {
  active: { label: "Aktif", variant: "default" as const },
  pending: { label: "Beklemede", variant: "secondary" as const },
  completed: { label: "Tamamlandı", variant: "outline" as const },
}

export function ContractCard({ contract, onView, onDownload }: ContractCardProps) {
  const status = statusConfig[contract.status]

  return (
    <Card className="glass-effect">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{contract.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{contract.project}</p>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{contract.client}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{contract.amount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{contract.startDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{contract.endDate}</span>
              </div>
            </div>

            {contract.status !== "pending" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">İlerleme</span>
                  <span className="font-medium">{contract.progress}%</span>
                </div>
                <Progress value={contract.progress} className="h-2" />
              </div>
            )}
          </div>

          <div className="flex gap-2 lg:flex-col">
            <Button variant="outline" size="sm" className="flex-1 lg:flex-none bg-transparent" onClick={onView}>
              Görüntüle
            </Button>
            <Button variant="outline" size="sm" className="flex-1 lg:flex-none bg-transparent" onClick={onDownload}>
              İndir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
