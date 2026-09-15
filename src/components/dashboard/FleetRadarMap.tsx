'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Navigation, Wrench } from 'lucide-react';

export interface VehicleMarkerData {
  id: string;
  tech: string;
  role: string;
  status: string;
  job: string;
  isWorking: boolean;
  lat: number;
  lng: number;
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
  },
];

export function FleetRadarMap({ className, activeCrew }: FleetRadarMapProps) {
  const [zoom, setZoom] = useState(2);
  const [isSatellite, setIsSatellite] = useState(false);

  // Maintain 5 animated vehicle markers at deterministic fixed positions
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
          lat: defaultVan.lat,
          lng: defaultVan.lng,
        };
      }
      return defaultVan;
    });
  }, [activeCrew]);

  const activeWorkingCount = useMemo(
    () => vehicles.filter((v) => v.isWorking).length,
    [vehicles]
  );

  return (
    <Card className={cn("glass-panel-elevated overflow-hidden border border-sky-500/30", className)}>
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "p-2 rounded-xl transition-colors",
              isSatellite
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-sky-500/15 text-sky-600 dark:text-sky-300"
            )}
          >
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              Metropolitan Field Service Radar
              {isSatellite && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Satellite Imagery
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Live GPS telemetry of dispatched technicians & active customer stops
            </p>
          </div>
        </div>

        {/* Top-right Controls: Active Counter, Map/Sat Segmented Control, Zoom +/- */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
          <div className="hidden md:flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {activeWorkingCount} Active on Site
            </span>
          </div>

          {/* View toggle: Map / Sat segmented control */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setIsSatellite(false)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                !isSatellite
                  ? "bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              )}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setIsSatellite(true)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                isSatellite
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              )}
            >
              Sat
            </button>
          </div>

          {/* Zoom controls: + / - buttons */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 gap-1">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(5, prev + 1))}
              disabled={zoom >= 5}
              className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all"
              aria-label="Zoom in"
              title="Zoom In"
            >
              +
            </button>
            <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-zinc-400 px-1 select-none">
              {zoom}x
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, prev - 1))}
              disabled={zoom <= 1}
              className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all"
              aria-label="Zoom out"
              title="Zoom Out"
            >
              -
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Map Viewport Container */}
        <div
          className={cn(
            "relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border shadow-inner transition-colors duration-500",
            isSatellite
              ? "bg-[#2b2118] dark:bg-[#1e1610] border-amber-900/50 shadow-[#1a120b]/50"
              : "bg-slate-950 dark:bg-zinc-950 border-slate-800 shadow-black/60"
          )}
        >
          {/* Zoomable Map Canvas Layer */}
          <div
            className="absolute inset-0 origin-center transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoom * 0.5 + 0.5})` }}
          >
            {/* Satellite Mode Sepia / Brown Terrain Tones */}
            {isSatellite && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none opacity-80"
                  style={{
                    background: "radial-gradient(circle at 50% 50%, #3e2d21 0%, #2b2118 60%, #1c150f 100%)",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
                  style={{
                    backgroundImage: `radial-gradient(ellipse at 25% 30%, #78350f 0%, transparent 50%),
                                      radial-gradient(ellipse at 75% 65%, #92400e 0%, transparent 55%),
                                      radial-gradient(ellipse at 50% 85%, #451a03 0%, transparent 60%)`,
                  }}
                />
              </>
            )}

            {/* CSS Grid simulating a map with grid lines */}
            <div
              className={cn(
                "absolute inset-0 pointer-events-none transition-opacity duration-500",
                isSatellite ? "opacity-35" : "opacity-25"
              )}
              style={{
                backgroundImage: isSatellite
                  ? `linear-gradient(to right, rgba(217, 119, 6, 0.25) 1px, transparent 1px),
                     linear-gradient(to bottom, rgba(217, 119, 6, 0.25) 1px, transparent 1px),
                     linear-gradient(to right, rgba(245, 158, 11, 0.4) 2px, transparent 2px),
                     linear-gradient(to bottom, rgba(245, 158, 11, 0.4) 2px, transparent 2px)`
                  : `linear-gradient(to right, rgba(56, 189, 248, 0.2) 1px, transparent 1px),
                     linear-gradient(to bottom, rgba(56, 189, 248, 0.2) 1px, transparent 1px),
                     linear-gradient(to right, rgba(14, 165, 233, 0.4) 2px, transparent 2px),
                     linear-gradient(to bottom, rgba(14, 165, 233, 0.4) 2px, transparent 2px)`,
                backgroundSize: "32px 32px, 32px 32px, 128px 128px, 128px 128px",
              }}
            />

            {/* GPS Telemetry Radial Grid Points */}
            <div
              className={cn(
                "absolute inset-0 pointer-events-none opacity-20",
                isSatellite
                  ? "bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]"
                  : "bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"
              )}
            />

            {/* Radar Concentric Circles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "w-48 h-48 rounded-full border transition-colors duration-500",
                  isSatellite ? "border-amber-500/30" : "border-sky-500/25"
                )}
              />
              <div
                className={cn(
                  "w-96 h-96 rounded-full border transition-colors duration-500",
                  isSatellite ? "border-amber-500/20" : "border-sky-500/15"
                )}
              />
              <div
                className={cn(
                  "w-[560px] h-[560px] rounded-full border transition-colors duration-500",
                  isSatellite ? "border-amber-500/10" : "border-sky-500/10"
                )}
              />
            </div>

            {/* Radar Sweep Effect */}
            <div
              className={cn(
                "absolute inset-0 origin-center pointer-events-none animate-[spin_8s_linear_infinite]",
                isSatellite
                  ? "bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
                  : "bg-gradient-to-r from-transparent via-sky-500/10 to-transparent"
              )}
            />

            {/* Simulated Geographic Sector Labels */}
            <div className="absolute top-4 left-4 text-[9px] font-mono tracking-widest text-sky-400/40 dark:text-sky-300/30 pointer-events-none select-none">
              [SECTOR NORTH-01 // METRO PLAZA]
            </div>
            <div className="absolute bottom-4 left-4 text-[9px] font-mono tracking-widest text-sky-400/40 dark:text-sky-300/30 pointer-events-none select-none">
              [SECTOR SOUTH-03 // INDUSTRIAL DISTRICT]
            </div>
            <div className="absolute bottom-4 right-4 text-[9px] font-mono tracking-widest text-sky-400/40 dark:text-sky-300/30 pointer-events-none select-none">
              [SECTOR EAST-04 // TECH CORRIDOR]
            </div>

            {/* 5 Animated Vehicle Markers at Fixed Positions */}
            {vehicles.map((van) => (
              <div
                key={van.id}
                data-testid="vehicle-marker"
                style={{ top: `${van.lat}%`, left: `${van.lng}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer select-none"
              >
                {/* Animated Pulsing Beacon Wave */}
                <span
                  className={cn(
                    "absolute -inset-2.5 rounded-full animate-ping pointer-events-none opacity-40",
                    van.isWorking ? "bg-emerald-400 dark:bg-emerald-500" : "bg-sky-400 dark:bg-sky-500"
                  )}
                />

                <div className="relative flex flex-col items-center">
                  {/* Vehicle Icon Pin */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-2xl text-white flex items-center justify-center shadow-lg border-2 transition-transform duration-200 group-hover:scale-115 relative z-10",
                      isSatellite
                        ? van.isWorking
                          ? "bg-amber-600 border-amber-300 shadow-amber-900/60"
                          : "bg-amber-800 border-amber-400 shadow-amber-950/60"
                        : van.isWorking
                        ? "bg-emerald-500 border-white dark:border-slate-900 shadow-emerald-500/50"
                        : "bg-sky-500 border-white dark:border-slate-900 shadow-sky-500/50"
                    )}
                  >
                    <Wrench className="w-4 h-4 text-white" />
                    {/* Active telemetry blinking LED */}
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 animate-pulse",
                        van.isWorking ? "bg-emerald-300" : "bg-sky-300"
                      )}
                    />
                  </div>

                  {/* Technician Label Pill */}
                  <span className="text-[10px] font-bold text-white bg-slate-900/90 dark:bg-zinc-950/90 px-2 py-0.5 rounded-full mt-1 border border-white/20 dark:border-zinc-700/60 whitespace-nowrap shadow-md">
                    {van.tech}
                  </span>
                </div>

                {/* Hover Details Popover */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur border border-sky-400/40 dark:border-sky-500/30 text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate">{van.tech}</p>
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        van.isWorking ? "bg-emerald-400" : "bg-sky-400"
                      )}
                    />
                  </div>
                  <p className="text-[11px] text-sky-400 dark:text-sky-300 mt-0.5 truncate">{van.status}</p>
                  <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 dark:text-zinc-400 border-t border-slate-800 dark:border-zinc-800 pt-1">
                    <span>Order: {van.job}</span>
                    <span>{van.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Roster Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {vehicles.map((crew) => (
            <div
              key={crew.id}
              className="p-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 text-white",
                    crew.isWorking
                      ? isSatellite
                        ? "bg-amber-600 text-white"
                        : "bg-emerald-500 text-white"
                      : "bg-sky-500 text-white"
                  )}
                >
                  {crew.tech.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{crew.tech}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{crew.status}</p>
                </div>
              </div>
              <Badge variant={crew.isWorking ? "success" : "secondary"} className="text-[9px] py-0 shrink-0 ml-1">
                {crew.job}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default FleetRadarMap;
