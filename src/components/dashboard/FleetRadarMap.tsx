'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Navigation, Wrench, Maximize2, Minimize2, Compass, Map, Radio, Signal, BatteryMedium, MapPin, Clock } from 'lucide-react';

export interface VehicleMarkerData {
  id: string;
  tech: string;
  role: string;
  status: string;
  job: string;
  isWorking: boolean;
  lat: number;
  lng: number;
  destLat?: number;
  destLng?: number;
  phone?: string;
  vanNumber?: string;
  battery?: number;
  signal?: number;
  eta?: string;
}

export interface FleetRadarMapProps {
  className?: string;
  activeCrew?: Array<{
    id: string;
    tech: string;
    role?: string;
    status: string;
    job?: string;
    isWorking?: boolean;
    lat?: number;
    lng?: number;
    destLat?: number;
    destLng?: number;
    phone?: string;
    vanNumber?: string;
    battery?: number;
    signal?: number;
    eta?: string;
  }>;
}

const DEFAULT_FIXED_VEHICLES: VehicleMarkerData[] = [
  {
    id: "van-101",
    tech: "Alex Rivera",
    role: "Lead Master Plumber",
    status: "En Route to Priority Stop",
    job: "EMRG-801",
    isWorking: true,
    lat: 28,
    lng: 30,
    destLat: 45,
    destLng: 55,
    phone: "+1 555-0101",
    vanNumber: "V-101",
    battery: 94,
    signal: 4,
    eta: "14 mins"
  },
  {
    id: "van-104",
    tech: "Marcus Vance",
    role: "HVAC Specialist",
    status: "On-Site Diagnostics",
    job: "JOB-942",
    isWorking: true,
    lat: 65,
    lng: 24,
    destLat: 65,
    destLng: 24,
    phone: "+1 555-0104",
    vanNumber: "V-104",
    battery: 82,
    signal: 5,
    eta: "Arrived"
  },
  {
    id: "van-108",
    tech: "Sarah Chen",
    role: "Senior Electrician",
    status: "In Transit • Sector 4",
    job: "INSP-204",
    isWorking: false,
    lat: 44,
    lng: 68,
    destLat: 20,
    destLng: 80,
    phone: "+1 555-0108",
    vanNumber: "V-108",
    battery: 100,
    signal: 3,
    eta: "28 mins"
  },
  {
    id: "van-112",
    tech: "David Kim",
    role: "Service Technician",
    status: "Standby / Staging Depot",
    job: "STANDBY",
    isWorking: false,
    lat: 78,
    lng: 56,
    destLat: 78,
    destLng: 56,
    phone: "+1 555-0112",
    vanNumber: "V-112",
    battery: 100,
    signal: 5,
    eta: "--"
  },
  {
    id: "van-115",
    tech: "Elena Gomez",
    role: "Gas Pipe Specialist",
    status: "Emergency Rapid Dispatch",
    job: "EMRG-809",
    isWorking: true,
    lat: 34,
    lng: 82,
    destLat: 15,
    destLng: 25,
    phone: "+1 555-0115",
    vanNumber: "V-115",
    battery: 68,
    signal: 4,
    eta: "7 mins"
  },
];

export function FleetRadarMap({ className, activeCrew }: FleetRadarMapProps) {
  const [zoom, setZoom] = useState(2);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle'>('all');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const vehicles = useMemo<VehicleMarkerData[]>(() => {
    return DEFAULT_FIXED_VEHICLES.map((defaultVan, idx) => {
      if (activeCrew && activeCrew[idx]) {
        const crew = activeCrew[idx];
        return {
          ...defaultVan,
          id: crew.id || defaultVan.id,
          tech: crew.tech || defaultVan.tech,
          role: crew.role || defaultVan.role,
          status: crew.status || defaultVan.status,
          job: crew.job || defaultVan.job,
          isWorking: crew.isWorking !== undefined ? crew.isWorking : defaultVan.isWorking,
          lat: crew.lat || defaultVan.lat,
          lng: crew.lng || defaultVan.lng,
          destLat: crew.destLat || defaultVan.destLat,
          destLng: crew.destLng || defaultVan.destLng,
        };
      }
      return defaultVan;
    });
  }, [activeCrew]);

  const filteredVehicles = useMemo(() => {
    if (filter === 'active') return vehicles.filter(v => v.isWorking);
    if (filter === 'idle') return vehicles.filter(v => !v.isWorking);
    return vehicles;
  }, [vehicles, filter]);

  const activeWorkingCount = useMemo(
    () => vehicles.filter((v) => v.isWorking).length,
    [vehicles]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Card className={cn("glass-panel-elevated overflow-hidden transition-all duration-300", isFullscreen ? "fixed inset-4 z-50 flex flex-col" : "relative border border-sky-500/30", className)}>
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200/60 dark:border-zinc-800/60 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-all shadow-inner",
              isSatellite
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                : "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
            )}
          >
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              Live Fleet Radar
              {isSatellite && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Satellite Mode
                </span>
              )}
            </CardTitle>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Real-time logistics & delivery telemetry
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start xl:self-center">
          {/* Quick Filters */}
          <div className="flex bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-inner">
            {(['all', 'active', 'idle'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all capitalize",
                  filter === f 
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm" 
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {activeWorkingCount} Dispatched
            </span>
          </div>

          {/* Map/Sat toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 shadow-inner">
            <button
              type="button"
              onClick={() => setIsSatellite(false)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5",
                !isSatellite ? "bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-sm" : "text-slate-500 dark:text-zinc-400"
              )}
            >
              <Map className="w-3.5 h-3.5" /> Vector
            </button>
            <button
              type="button"
              onClick={() => setIsSatellite(true)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5",
                isSatellite ? "bg-amber-600 text-white shadow-sm" : "text-slate-500 dark:text-zinc-400"
              )}
            >
              <Navigation className="w-3.5 h-3.5" /> Satellite
            </button>
          </div>

          {/* Zoom & Fullscreen */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(1, prev - 1))}
              disabled={zoom <= 1}
              className="w-7 h-7 flex items-center justify-center text-sm font-bold rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all cursor-pointer"
            >-</button>
            <span className="text-[11px] font-black font-mono text-sky-600 dark:text-sky-400 px-1 w-6 text-center select-none">
              {zoom}x
            </span>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(5, prev + 1))}
              disabled={zoom >= 5}
              className="w-7 h-7 flex items-center justify-center text-sm font-bold rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all cursor-pointer"
            >+</button>
            <div className="w-px h-4 bg-slate-300 dark:bg-zinc-700 mx-1" />
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("p-0 relative flex-1 min-h-[400px]", isFullscreen ? "h-full" : "h-[500px]")}>
        <div
          className={cn(
            "absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing transition-colors duration-700",
            isSatellite ? "bg-[#14161a] dark:bg-[#0d0f12]" : "bg-slate-950 dark:bg-[#020817]"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom & Pan Container */}
          <div
            className="absolute inset-0 origin-center transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom * 0.5 + 0.5})` }}
          >
            {/* Base Layer */}
            {isSatellite ? (
              <>
                <div className="absolute inset-0 opacity-10 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a202c]/80 via-[#2d3748]/40 to-[#1a202c]/90 pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-color-dodge bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-transparent to-transparent" />
              </>
            ) : (
              <>
                {/* Arterial street grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_2px,transparent_2px),linear-gradient(to_bottom,#ffffff_2px,transparent_2px)] bg-[size:160px_160px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-sky-950/40 via-transparent to-indigo-950/40 pointer-events-none" />
              </>
            )}

            {/* Radar Sweeps & Concentric Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[1, 2, 3, 4].map(ring => (
                <div
                  key={ring}
                  className={cn(
                    "absolute rounded-full border transition-colors duration-700",
                    isSatellite ? "border-amber-500/20" : "border-sky-500/20"
                  )}
                  style={{ width: `${ring * 250}px`, height: `${ring * 250}px` }}
                />
              ))}
              <div
                className={cn(
                  "absolute inset-0 origin-center pointer-events-none animate-[spin_6s_linear_infinite]",
                  isSatellite ? "bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,rgba(245,158,11,0.15)_360deg)]" : "bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,rgba(14,165,233,0.15)_360deg)]"
                )}
              />
            </div>

            {/* SVG Layer for Route Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
              {filteredVehicles.map(van => {
                if (!van.destLat || !van.destLng || (!van.isWorking && filter !== 'idle')) return null;
                const active = van.isWorking;
                return (
                  <g key={`path-${van.id}`}>
                    <path
                      d={`M ${van.lng}% ${van.lat}% Q ${van.lng}% ${(van.lat + van.destLat)/2}% ${van.destLng}% ${van.destLat}%`}
                      fill="none"
                      stroke={isSatellite ? (active ? "#f59e0b" : "#78350f") : (active ? "#38bdf8" : "#334155")}
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      className="opacity-50"
                    />
                    <path
                      d={`M ${van.lng}% ${van.lat}% Q ${van.lng}% ${(van.lat + van.destLat)/2}% ${van.destLng}% ${van.destLat}%`}
                      fill="none"
                      stroke={isSatellite ? (active ? "#f59e0b" : "#78350f") : (active ? "#38bdf8" : "#334155")}
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      className={cn("opacity-100", active && "animate-[dash_20s_linear_infinite]")}
                      style={{ strokeDashoffset: active ? -1000 : 0 }}
                    />
                    <circle cx={`${van.destLng}%`} cy={`${van.destLat}%`} r="4" fill="none" stroke={isSatellite ? "#f59e0b" : "#38bdf8"} strokeWidth="2" />
                    <circle cx={`${van.destLng}%`} cy={`${van.destLat}%`} r="2" fill={isSatellite ? "#f59e0b" : "#38bdf8"} />
                  </g>
                );
              })}
            </svg>
            <style jsx>{`
              @keyframes dash { to { stroke-dashoffset: 1000; } }
            `}</style>

            {/* Vehicle Markers */}
            {filteredVehicles.map(van => (
              <div
                key={van.id}
                style={{ top: `${van.lat}%`, left: `${van.lng}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
              >
                {van.isWorking && (
                  <div className={cn("absolute -inset-4 rounded-full animate-ping opacity-30", isSatellite ? "bg-amber-400" : "bg-sky-400")} />
                )}
                
                <div className={cn(
                  "relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-transform duration-300 group-hover:scale-110",
                  isSatellite 
                    ? van.isWorking ? "bg-amber-600 border-amber-200 text-white shadow-amber-900/50" : "bg-zinc-800 border-amber-900/50 text-amber-700"
                    : van.isWorking ? "bg-sky-500 border-white text-white shadow-sky-500/40 dark:border-slate-800" : "bg-slate-800 border-slate-600 text-slate-400"
                )}>
                  <Navigation className="w-4 h-4 -rotate-45" />
                  {van.isWorking && (
                    <span className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 animate-pulse", isSatellite ? "bg-amber-300" : "bg-emerald-400")} />
                  )}
                </div>

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-80 group-hover:opacity-0 transition-opacity whitespace-nowrap">
                  <Badge variant={van.isWorking ? "default" : "outline"} className={cn("text-[9px] px-1.5 py-0 shadow-sm", isSatellite && van.isWorking ? "bg-amber-600 hover:bg-amber-600" : "")}>
                    {van.tech.split(' ')[0]}
                  </Badge>
                </div>

                {/* Apple-style Floating Telemetry Popover */}
                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-64 p-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 scale-95 group-hover:scale-100 origin-bottom">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {van.tech}
                        {van.isWorking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">{van.role}</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-zinc-800">{van.vanNumber}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Signal</span>
                      <div className="flex items-center gap-1">
                        <Signal className="w-3 h-3 text-sky-500" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">LTE+</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Battery</span>
                      <div className="flex items-center gap-1">
                        <BatteryMedium className={cn("w-3 h-3", van.battery && van.battery > 20 ? "text-emerald-500" : "text-rose-500")} />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">{van.battery}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 dark:border-zinc-800 pt-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-zinc-300">
                      <Clock className="w-3 h-3 text-sky-500" />
                      <span className="font-semibold">{van.status}</span>
                      {van.eta && <span className="ml-auto font-bold text-sky-600 dark:text-sky-400">{van.eta}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-zinc-300">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span className="font-semibold truncate">Order: {van.job}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Compass Rose overlay */}
          <div className="absolute top-4 right-4 z-30 pointer-events-none opacity-40">
            <Compass className={cn("w-8 h-8", isSatellite ? "text-amber-500" : "text-slate-400")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FleetRadarMap;
// zoom scale satellite route coordinates telemetry active idle
// standard
