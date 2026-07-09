'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, MapPin, Navigation, RefreshCw, Loader2, Home, Building2, Map as MapIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

interface BusArrival {
    hatNo: string;
    hatHarf: string;
    hatAdi: string;
    sure: string;
    sureDakika: number;
    yon: string;
    canliIzle: boolean;
    hatKodu: string;
}

const STOPS = [
    {
        id: '1658',
        name: 'Eşrefoğlu',
        fullName: 'EŞREFOĞLU İLKOKULU',
        filter: ['52', '56', '48', '67', '109'],
        showOfis: false,
        showEv: true
    },
    {
        id: '1635',
        name: 'Adaklı',
        fullName: 'ADAKLI',
        filter: ['52', '56', '48', '67'],
        showOfis: true,
    }
];

export function AtusWidget() {
    const [activeStop, setActiveStop] = useState(STOPS[0]);
    const [busData, setBusData] = useState<BusArrival[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [mapModal, setMapModal] = useState<{ open: boolean, url: string, title: string }>({
        open: false,
        url: '',
        title: ''
    });

    const fetchBusData = useCallback(async (stopId: string, filter: string[]) => {
        setLoading(true);
        try {
            const filterParam = filter.length > 0 ? `&hatlar=${filter.join(',')}` : '';
            const response = await fetch(`/api/atus/live?durakNo=${stopId}${filterParam}`);
            const result = await response.json();
            if (result.success && result.data) {
                setBusData(result.data);
                setError(null);
            } else {
                setError(result.error || 'Veri alınamadı');
            }
        } catch (err) {
            setError('Bağlantı hatası');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBusData(activeStop.id, activeStop.filter);
        const interval = setInterval(() => fetchBusData(activeStop.id, activeStop.filter), 30000);
        return () => clearInterval(interval);
    }, [fetchBusData, activeStop]);

    const sortBuses = (a: BusArrival, b: BusArrival) => {
        const aIsTarife = a.sure.toLowerCase().includes('tarife');
        const bIsTarife = b.sure.toLowerCase().includes('tarife');
        if (aIsTarife && !bIsTarife) return 1;
        if (!aIsTarife && bIsTarife) return -1;
        return a.sureDakika - b.sureDakika;
    };

    // Ofis Yönü Filtresi
    const ofisGidis = busData.filter(b =>
        b.yon.toUpperCase().includes('ÇINARALTI') ||
        b.yon.toUpperCase().includes('KÜLTÜRPARK') ||
        b.yon.toUpperCase().includes('ALAADDİN') ||
        b.yon.toUpperCase().includes('MERAM')
    ).sort(sortBuses);

    // Ev Yönü Filtresi
    const eveDonus = busData.filter(b =>
        b.yon.toUpperCase().includes('YAZIR')
    ).sort(sortBuses);

    const openMap = (bus: BusArrival, stopId: string) => {
        // ATUS'un harita sayfasını iframe olarak açıyoruz
        const url = `https://atus.konya.bel.tr/atus/otobusum-nerede?durakNo=${stopId}&harita=${bus.hatKodu}`;
        setMapModal({
            open: true,
            url,
            title: `${bus.hatNo} ${bus.yon} - Canlı Takip`
        });
    };

    const BusItem = ({ bus, stopId, highlight = 'none' }: { bus: BusArrival, stopId: string, highlight?: 'min' | 'max' | 'none' | 'tarife' }) => {
        const isArriving = bus.sureDakika === -1;

        let bgClass = "bg-muted/30 border-border/50 hover:bg-muted/50";
        if (highlight === 'tarife') {
            bgClass = "bg-muted/10 border-border/20 opacity-40 grayscale hover:opacity-75";
        } else if (highlight === 'min') {
            bgClass = "bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25";
        } else if (highlight === 'max') {
            bgClass = "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20";
        }

        return (
            <motion.div 
                layout
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`group flex items-center justify-between p-2.5 rounded-lg border transition-colors duration-300 ${bgClass}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md font-bold text-[11px] bg-primary/10 text-primary shrink-0">
                        {bus.hatNo}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-[12px] font-semibold flex items-center gap-1.5 truncate">
                            {bus.yon}
                            {bus.canliIzle && (
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                            {bus.hatAdi.toLowerCase()}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                    <button
                        onClick={() => openMap(bus, stopId)}
                        className="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all duration-200"
                        title="Haritada Gör"
                    >
                        <MapIcon className="w-3.5 h-3.5" />
                    </button>

                    <div className={`text-xs font-bold leading-none ${isArriving ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-foreground'}`}>
                        {isArriving ? 'DURAKTA' : bus.sure}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <Card className="shadow-sm border-border bg-card">
            <CardHeader className="p-4 pb-0 flex flex-col space-y-4">
                <div className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-primary" />
                        <CardTitle className="text-sm font-bold">Canlı Otobüs Takip</CardTitle>
                    </div>
                    <button
                        onClick={() => fetchBusData(activeStop.id, activeStop.filter)}
                        disabled={loading}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                </div>

                <div className="flex items-center gap-1 border-b border-border/50 pb-2 overflow-x-auto no-scrollbar">
                    {STOPS.map((stop) => (
                        <button
                            key={stop.id}
                            onClick={() => setActiveStop(stop)}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200 whitespace-nowrap ${activeStop.id === stop.id
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {stop.name}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-4">
                <div className={`grid grid-cols-1 ${activeStop.showOfis && activeStop.showEv ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>

                    {activeStop.showOfis && (
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 px-1 text-blue-600 dark:text-blue-400">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Ofise Gidiş</span>
                                <span className="text-[10px] text-muted-foreground font-normal ml-auto">#{activeStop.id}</span>
                            </div>
                            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5">
                                <AnimatePresence mode="popLayout">
                                    {ofisGidis.length > 0 ? (
                                        ofisGidis.map((bus, i) => {
                                            const isTarife = bus.sure.toLowerCase().includes('tarife');
                                            const validBuses = ofisGidis.filter(b => !b.sure.toLowerCase().includes('tarife'));
                                            let h = 'none';
                                            if (isTarife) h = 'tarife';
                                            else if (validBuses.length > 1) {
                                                if (bus === validBuses[0]) h = 'min';
                                                else if (bus === validBuses[validBuses.length - 1]) h = 'max';
                                            }

                                            return (
                                                <BusItem 
                                                    key={`ofis-${bus.hatNo}-${bus.hatKodu || i}`} 
                                                    bus={bus} 
                                                    stopId={activeStop.id}
                                                    highlight={h as 'min' | 'max' | 'none' | 'tarife'}
                                                />
                                            )
                                        })
                                    ) : (
                                        <motion.div 
                                            key="empty-ofis"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="col-span-full text-[11px] text-muted-foreground/60 italic p-4 text-center border border-dashed rounded-lg bg-muted/5"
                                        >
                                            Ofis yönüne aktif servis bulunamadı
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    )}

                    {activeStop.showEv && (
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 px-1 text-purple-600 dark:text-purple-400">
                                <Home className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Eve Dönüş</span>
                                <span className="text-[10px] text-muted-foreground font-normal ml-auto">#{activeStop.id}</span>
                            </div>
                            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5">
                                <AnimatePresence mode="popLayout">
                                    {eveDonus.length > 0 ? (
                                        eveDonus.map((bus, i) => {
                                            const isTarife = bus.sure.toLowerCase().includes('tarife');
                                            const validBuses = eveDonus.filter(b => !b.sure.toLowerCase().includes('tarife'));
                                            let h = 'none';
                                            if (isTarife) h = 'tarife';
                                            else if (validBuses.length > 1) {
                                                if (bus === validBuses[0]) h = 'min';
                                                else if (bus === validBuses[validBuses.length - 1]) h = 'max';
                                            }

                                            return (
                                                <BusItem 
                                                    key={`ev-${bus.hatNo}-${bus.hatKodu || i}`} 
                                                    bus={bus} 
                                                    stopId={activeStop.id} 
                                                    highlight={h as 'min' | 'max' | 'none' | 'tarife'}
                                                />
                                            )
                                        })
                                    ) : (
                                        <motion.div 
                                            key="empty-ev"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="col-span-full text-[11px] text-muted-foreground/60 italic p-4 text-center border border-dashed rounded-lg bg-muted/5"
                                        >
                                            Ev yönüne aktif servis bulunamadı
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-3 text-[10px] text-destructive flex items-center gap-1 bg-destructive/5 p-1.5 rounded border border-destructive/10">
                        <Navigation className="w-3 h-3" />
                        <span>Sistem kontrolü gerekli. ATUS sitesine bir kez girip çıkın.</span>
                    </div>
                )}
            </CardContent>

            {/* Premium Harita Popup (Native Görünümlü) */}
            <Dialog open={mapModal.open} onOpenChange={(open) => setMapModal(prev => ({ ...prev, open }))}>
                <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden border-0 bg-[#f8f9fa] dark:bg-[#1a1c1e] shadow-2xl">
                    {/* Header - Sitenin kendi header'ı gibi duruyor */}
                    <div className="absolute top-0 left-0 right-0 h-14 bg-card border-b z-20 flex items-center justify-between px-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <MapIcon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm tracking-tight">{mapModal.title}</span>
                        </div>
                        <button
                            onClick={() => setMapModal(prev => ({ ...prev, open: false }))}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Harita Alanı - Atus Header/Menu/Footer gizlendi */}
                    <div className="relative w-full h-full overflow-hidden mt-0 rounded-b-xl">
                        <div className="absolute inset-0 z-0 bg-muted animate-pulse flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
                        </div>
                        <iframe
                            src={mapModal.url}
                            style={{
                                width: '100%',
                                height: 'calc(100% + 220px)', // Alttaki fazlalığı da kapsa
                                marginTop: '-155px', // ATUS header'ını yukarı it (crop)
                                border: 'none',
                                position: 'relative',
                                zIndex: 1
                            }}
                            title="Konya Canlı Harita"
                            loading="lazy"
                        />
                        {/* Yan taraflardaki menüleri kapatmak için beyaz overlay şeritleri (opsiyonel) */}
                        <div className="absolute top-0 left-0 w-4 h-full bg-[#f8f9fa] dark:bg-[#1a1c1e] z-10" />
                        <div className="absolute top-0 right-0 w-4 h-full bg-[#f8f9fa] dark:bg-[#1a1c1e] z-10" />
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
