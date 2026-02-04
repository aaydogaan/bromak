"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { formatDateRange, getLeaveTypeColor, getStatusLabel, getStatusColor, getLeaveTypeIcon } from "@/lib/leave-utils"
import type { LeaveRecord } from "@/types/leave"

interface LeaveListViewProps {
    leaves: LeaveRecord[]
    onLeaveClick: (leave: LeaveRecord) => void
}

export function LeaveListView({ leaves, onLeaveClick }: LeaveListViewProps) {
    if (leaves.length === 0) {
        return (
            <Card className="glass-effect">
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <p className="text-lg font-medium">Henüz izin kaydı bulunmuyor</p>
                        <p className="text-sm mt-2">Yeni bir izin kaydı eklemek için yukarıdaki butonu kullanın</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glass-effect">
            <CardHeader>
                <CardTitle>İzin Kayıtları ({leaves.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {leaves.map((leave) => {
                        const typeColors = getLeaveTypeColor(leave.leave_type)
                        const statusColors = getStatusColor(leave.status)

                        return (
                            <div
                                key={leave.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all"
                            >
                                <div className="flex-1 space-y-2">
                                    {/* Employee Name & Leave Type */}
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-foreground text-lg">
                                            {leave.employee_name}
                                        </h3>
                                        <Badge
                                            variant="outline"
                                            className={`${typeColors.bg} ${typeColors.text} border-0`}
                                        >
                                            {getLeaveTypeIcon(leave.leave_type)} {leave.leave_type}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={`${statusColors.bg} ${statusColors.text} border-0`}
                                        >
                                            {getStatusLabel(leave.status)}
                                        </Badge>
                                    </div>

                                    {/* Date Range & Days */}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>📅 {formatDateRange(leave.start_date, leave.end_date)}</span>
                                        <span>•</span>
                                        <span className="font-medium">{leave.total_days} gün</span>
                                    </div>

                                    {/* Description */}
                                    {leave.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {leave.description}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onLeaveClick(leave)}
                                    className="ml-4"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Detay
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
