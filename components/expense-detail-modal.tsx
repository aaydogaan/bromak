"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Money from "@/components/money"
import { Receipt, Calendar, Tag, FileText, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExpenseDetailModalProps {
    expense: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ExpenseDetailModal({ expense, open, onOpenChange }: ExpenseDetailModalProps) {
    if (!expense) return null

    const tl = (n: number) => `₺${(n || 0).toLocaleString('tr-TR')}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-950 border-border shadow-2xl backdrop-blur-none">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Receipt className="h-6 w-6 text-primary" />
                        Gider Detayı
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Kategori</Label>
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Tag className="h-4 w-4 text-primary" />
                                    {expense.category}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Tutar</Label>
                                <div className="text-3xl font-bold text-destructive">
                                    <Money value={tl(expense.amount)} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Tarih</Label>
                                <div className="flex items-center gap-2 text-foreground">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {new Date(expense.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Açıklama</Label>
                                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm min-h-[80px]">
                                    {expense.description || 'Açıklama bulunmuyor.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Ekli Belge</Label>
                        {expense.attachment_url ? (
                            <div className="relative group overflow-hidden rounded-xl border border-border/50 bg-muted/20 aspect-video flex items-center justify-center">
                                {expense.attachment_url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                    <img
                                        src={expense.attachment_url}
                                        alt="Fatura/Dekont"
                                        className="object-contain w-full h-full max-h-[300px]"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-12 w-12 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground font-medium">Belge PDF formatında</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Button size="sm" variant="secondary" className="gap-2" asChild>
                                        <a href={expense.attachment_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                            Görüntüle
                                        </a>
                                    </Button>
                                    <Button size="sm" variant="secondary" className="gap-2" asChild>
                                        <a href={expense.attachment_url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="h-4 w-4" />
                                            İndir
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-border/50 bg-muted/10 text-muted-foreground italic text-sm">
                                Belge yüklenmemiş.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
