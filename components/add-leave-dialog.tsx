"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { calculateWorkingDays, getLeaveTypeIcon } from "@/lib/leave-utils"
import { triggerConfetti } from "@/lib/confetti"
import type { LeaveType, LeaveStatus } from "@/types/leave"

interface AddLeaveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    initialDate?: Date
}

export function AddLeaveDialog({ open, onOpenChange, onSuccess, initialDate }: AddLeaveDialogProps) {
    const [loading, setLoading] = useState(false)
    const [employeeName, setEmployeeName] = useState("")
    const [leaveType, setLeaveType] = useState<LeaveType>("Yıllık İzin")
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [description, setDescription] = useState("")
    const [status, setStatus] = useState<LeaveStatus>("approved")

    // Set initial dates when dialog opens with initialDate
    useEffect(() => {
        if (open && initialDate) {
            setStartDate(initialDate)
            setEndDate(initialDate)
        }
    }, [open, initialDate])

    const totalDays = startDate && endDate ? calculateWorkingDays(startDate, endDate) : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!employeeName || !startDate || !endDate) {
            return
        }

        setLoading(true)

        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()

            const { error } = await supabase.from("leave_records").insert({
                employee_name: employeeName,
                leave_type: leaveType,
                start_date: format(startDate, "yyyy-MM-dd"),
                end_date: format(endDate, "yyyy-MM-dd"),
                total_days: totalDays,
                description: description || null,
                status,
            })

            if (error) throw error

            // Trigger confetti animation
            triggerConfetti()

            // Send email notification
            try {
                await fetch('/api/email/leave', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employee_name: employeeName,
                        leave_type: leaveType,
                        start_date: format(startDate, "yyyy-MM-dd"),
                        end_date: format(endDate, "yyyy-MM-dd"),
                        total_days: totalDays,
                        status,
                        description: description || null,
                    }),
                })
            } catch (emailError) {
                console.error('Email notification error:', emailError)
                // Don't block the main flow if email fails
            }

            // Reset form
            setEmployeeName("")
            setLeaveType("Yıllık İzin")
            setStartDate(undefined)
            setEndDate(undefined)
            setDescription("")
            setStatus("approved")

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Error adding leave:", error)
            alert("İzin eklenirken bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Yeni İzin Kaydı</DialogTitle>
                    <DialogDescription>
                        Yeni bir izin kaydı oluşturun. Tüm alanları doldurun.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Employee Name */}
                    <div className="space-y-2">
                        <Label htmlFor="employee-name">Ad Soyad *</Label>
                        <Select value={employeeName} onValueChange={setEmployeeName}>
                            <SelectTrigger id="employee-name">
                                <SelectValue placeholder="Çalışan seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Recep Aydoğan">👤 Recep Aydoğan</SelectItem>
                                <SelectItem value="Enes Umut Parlak">👤 Enes Umut Parlak</SelectItem>
                                <SelectItem value="Selman Aydoğan">👤 Selman Aydoğan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Leave Type */}
                    <div className="space-y-2">
                        <Label htmlFor="leave-type">İzin Türü *</Label>
                        <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
                            <SelectTrigger id="leave-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Yıllık İzin">
                                    {getLeaveTypeIcon("Yıllık İzin")} Yıllık İzin
                                </SelectItem>
                                <SelectItem value="Hastalık İzni">
                                    {getLeaveTypeIcon("Hastalık İzni")} Hastalık İzni
                                </SelectItem>
                                <SelectItem value="Diğer">
                                    {getLeaveTypeIcon("Diğer")} Diğer
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Başlangıç Tarihi *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "d MMM yyyy", { locale: tr }) : "Tarih seçin"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        locale={tr}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Bitiş Tarihi *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "d MMM yyyy", { locale: tr }) : "Tarih seçin"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        locale={tr}
                                        disabled={(date) => startDate ? date < startDate : false}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Total Days */}
                    {totalDays > 0 && (
                        <div className="rounded-lg bg-primary/10 p-3 text-sm">
                            <span className="font-medium">Toplam İş Günü:</span>{" "}
                            <span className="font-bold text-primary">{totalDays} gün</span>
                            <span className="text-muted-foreground ml-2">(Hafta sonları hariç)</span>
                        </div>
                    )}

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Durum</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as LeaveStatus)}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved">✅ Onaylandı</SelectItem>
                                <SelectItem value="pending">⏳ Beklemede</SelectItem>
                                <SelectItem value="cancelled">❌ İptal Edildi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama</Label>
                        <Textarea
                            id="description"
                            placeholder="İzin nedeni veya ek bilgiler..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading || !employeeName || !startDate || !endDate}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
