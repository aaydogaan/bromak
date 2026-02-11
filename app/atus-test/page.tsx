'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bus, MapPin, Clock, RefreshCw, Loader2, AlertCircle, CheckCircle2, Navigation, ArrowRight } from 'lucide-react';

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

export default function AtusPage() {
    const [busData, setBusData] = useState<BusArrival[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const durakNo = '1658';
    const durakAdi = 'EŞREFOĞLU İLKOKULU';
    const targetBuses = ['52', '56'];

    const fetchBusData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/atus/live?durakNo=${durakNo}&hatlar=${targetBuses.join(',')}`);
            const result = await response.json();

            if (result.success && result.data) {
                setBusData(result.data);
                setLastUpdate(new Date());
            } else {
                setError(result.error || result.ipucu || 'Veri alınamadı');
            }
        } catch (err) {
            setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBusData();

        if (autoRefresh) {
            const interval = setInterval(fetchBusData, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchBusData, autoRefresh]);

    const getSureStyle = (sureDakika: number) => {
        if (sureDakika === -1) {
            return {
                bg: 'bg-emerald-500',
                text: 'text-emerald-500',
                border: 'border-emerald-500/30',
                gradient: 'from-emerald-500/10 to-emerald-500/5',
                label: 'DURAKTA',
                pulse: true,
            };
        }
        if (sureDakika > 0 && sureDakika <= 5) {
            return {
                bg: 'bg-green-500',
                text: 'text-green-600',
                border: 'border-green-500/30',
                gradient: 'from-green-500/10 to-green-500/5',
                label: `${sureDakika} dk`,
                pulse: false,
            };
        }
        if (sureDakika > 5 && sureDakika <= 15) {
            return {
                bg: 'bg-amber-500',
                text: 'text-amber-600',
                border: 'border-amber-500/30',
                gradient: 'from-amber-500/10 to-amber-500/5',
                label: `${sureDakika} dk`,
                pulse: false,
            };
        }
        if (sureDakika > 15) {
            return {
                bg: 'bg-orange-500',
                text: 'text-orange-600',
                border: 'border-orange-500/30',
                gradient: 'from-orange-500/10 to-orange-500/5',
                label: `${sureDakika} dk`,
                pulse: false,
            };
        }
        return {
            bg: 'bg-gray-400',
            text: 'text-gray-500',
            border: 'border-gray-300',
            gradient: 'from-gray-100 to-gray-50',
            label: 'Tarife',
            pulse: false,
        };
    };

    const getProgressWidth = (sureDakika: number) => {
        if (sureDakika === -1) return 100;
        if (sureDakika <= 0) return 0;
        return Math.max(0, Math.min(100, ((30 - sureDakika) / 30) * 100));
    };

    // Hat 52 ve 56'yı ayrı ayrı grupla
    const hat52 = busData.filter(b => b.hatNo === '52');
    const hat56 = busData.filter(b => b.hatNo === '56');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg">
                <div className="container mx-auto px-4 py-5 max-w-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 rounded-xl p-2.5 backdrop-blur-sm">
                            <Bus className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Otobüs Takip</h1>
                            <p className="text-blue-100 text-sm font-medium">Konya ATUS Canlı Takip</p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <MapPin className="h-4 w-4 text-blue-200 shrink-0" />
                        <div className="flex-1">
                            <span className="text-sm font-medium">{durakAdi}</span>
                            <span className="text-blue-200 text-xs ml-2">Durak #{durakNo}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-5 max-w-3xl">
                {/* Kontrol Barı */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {lastUpdate ? (
                                <span>
                                    {lastUpdate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            ) : (
                                <span>Yükleniyor...</span>
                            )}
                        </div>
                        {autoRefresh && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                Canlı
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`text-xs ${autoRefresh ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                        >
                            {autoRefresh ? 'Otomatik: Açık' : 'Otomatik: Kapalı'}
                        </Button>

                        <Button
                            onClick={fetchBusData}
                            disabled={loading}
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Hata Mesajı */}
                {error && (
                    <Card className="mb-5 border-red-200 bg-red-50/80 backdrop-blur-sm">
                        <CardContent className="py-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-700">Bağlantı Problemi</p>
                                <p className="text-xs text-red-600 mt-1">{error}</p>
                                <p className="text-xs text-red-500 mt-2">
                                    Cookie süresi dolmuş olabilir.{' '}
                                    <a href="https://atus.konya.bel.tr/atus/otobusum-nerede?durakNo=1658" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                                        ATUS sitesini ziyaret edip
                                    </a>{' '}
                                    cookie&apos;leri yenileyebilirsiniz.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Yükleniyor */}
                {loading && busData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-muted-foreground text-sm">ATUS&apos;tan veriler yükleniyor...</p>
                    </div>
                )}

                {/* Otobüs Kartları */}
                {!loading && busData.length === 0 && !error && (
                    <Card className="text-center py-8">
                        <CardContent>
                            <Bus className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">
                                Şu anda 52 ve 56 hatlarına ait aktif sefer bilgisi bulunamadı.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Hat 52 */}
                {hat52.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-600 text-white rounded-lg px-3 py-1 font-bold text-sm">
                                Hat 52
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                MERAM DEVLET HASTANESİ
                            </span>
                        </div>

                        <div className="space-y-3">
                            {hat52.map((bus, i) => {
                                const style = getSureStyle(bus.sureDakika);
                                return (
                                    <Card
                                        key={`52-${i}`}
                                        className={`overflow-hidden border ${style.border} bg-gradient-to-r ${style.gradient} hover:shadow-md transition-all duration-300`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {bus.hatNo}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-sm truncate">{bus.hatAdi}</span>
                                                            <Badge variant="outline" className="text-[10px] shrink-0">{bus.hatHarf}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                            <Navigation className="h-3 w-3" />
                                                            <span>{bus.yon}</span>
                                                            {bus.canliIzle && (
                                                                <Badge variant="outline" className="text-[9px] ml-1 bg-green-50 text-green-600 border-green-200">
                                                                    Canlı
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Süre Badge */}
                                                <div className={`${style.bg} text-white rounded-xl px-4 py-2 font-bold text-base shrink-0 ml-3 ${style.pulse ? 'animate-pulse' : ''} shadow-sm`}>
                                                    {style.label}
                                                </div>
                                            </div>

                                            {/* İlerleme Çubuğu */}
                                            {bus.sureDakika !== 0 && (
                                                <div className="mt-3">
                                                    <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${style.bg} rounded-full transition-all duration-700 ease-out`}
                                                            style={{ width: `${getProgressWidth(bus.sureDakika)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hat 56 */}
                {hat56.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-purple-600 text-white rounded-lg px-3 py-1 font-bold text-sm">
                                Hat 56
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                ŞEYH ŞAMİL
                            </span>
                        </div>

                        <div className="space-y-3">
                            {hat56.map((bus, i) => {
                                const style = getSureStyle(bus.sureDakika);
                                return (
                                    <Card
                                        key={`56-${i}`}
                                        className={`overflow-hidden border ${style.border} bg-gradient-to-r ${style.gradient} hover:shadow-md transition-all duration-300`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {bus.hatNo}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-sm truncate">{bus.hatAdi}</span>
                                                            <Badge variant="outline" className="text-[10px] shrink-0">{bus.hatHarf}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                            <Navigation className="h-3 w-3" />
                                                            <span>{bus.yon}</span>
                                                            {bus.canliIzle && (
                                                                <Badge variant="outline" className="text-[9px] ml-1 bg-green-50 text-green-600 border-green-200">
                                                                    Canlı
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`${style.bg} text-white rounded-xl px-4 py-2 font-bold text-base shrink-0 ml-3 ${style.pulse ? 'animate-pulse' : ''} shadow-sm`}>
                                                    {style.label}
                                                </div>
                                            </div>

                                            {bus.sureDakika !== 0 && (
                                                <div className="mt-3">
                                                    <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${style.bg} rounded-full transition-all duration-700 ease-out`}
                                                            style={{ width: `${getProgressWidth(bus.sureDakika)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Bilgi Kartı */}
                <Card className="border-blue-100 bg-blue-50/50 backdrop-blur-sm">
                    <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>Veriler 30 saniyede bir ATUS&apos;tan güncellenir</p>
                                <p>
                                    <a
                                        href={`https://atus.konya.bel.tr/atus/otobusum-nerede?durakNo=${durakNo}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                    >
                                        ATUS resmi site <ArrowRight className="h-3 w-3" />
                                    </a>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
