import { useEffect, useState, useMemo, useCallback } from "react";
import { tradingSessions, timeSegments, type TradingSession, type TimeSegment } from "@/data/sessionSchedule";
import { getMarketStatus } from "@/utils/marketHours";

function useResponsiveLabelInterval(): number {
  const [interval, setInterval] = useState(() => window.innerWidth >= 768 ? 1 : 2);
  
  const updateInterval = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 768) {
      setInterval(1); // Show every hour on desktop
    } else {
      setInterval(2); // Show every 2 hours on mobile
    }
  }, []);
  
  useEffect(() => {
    updateInterval();
    window.addEventListener('resize', updateInterval);
    return () => window.removeEventListener('resize', updateInterval);
  }, [updateInterval]);
  
  return interval;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  
  const updateIsMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  useEffect(() => {
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, [updateIsMobile]);
  
  return isMobile;
}

export interface AlertMarker {
  id: string;
  label: string;
  utcHour: number;
  utcMinute: number;
  enabled: boolean;
}

interface UtcRulerProps {
  alerts?: AlertMarker[];
}

interface UtcTime {
  hours: number;
  minutes: number;
  seconds: number;
}

function getUtcTime(): UtcTime {
  const now = new Date();
  return {
    hours: now.getUTCHours(),
    minutes: now.getUTCMinutes(),
    seconds: now.getUTCSeconds(),
  };
}

function getIndicatorPosition(time: UtcTime): number {
  const totalMinutes = time.hours * 60 + time.minutes + time.seconds / 60;
  return (totalMinutes / (24 * 60)) * 100;
}

function getAlertPosition(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute;
  return (totalMinutes / (24 * 60)) * 100;
}

function getSessionLabel(): string {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  // Saturday (all day): show nothing
  if (utcDay === 6) return "";

  // Friday from 22:00 UTC onward: show nothing
  if (utcDay === 5 && utcHour >= 22) return "";

  // Sunday before 21:00 UTC: show nothing
  if (utcDay === 0 && utcHour < 21) return "";

  // Sunday from 21:00 UTC onward: show "Sydney session"
  if (utcDay === 0 && utcHour >= 21) return "Sydney session";

  // Monday–Friday behavior (UTC):
  if (utcHour >= 0 && utcHour < 6) return "Sydney + Tokyo overlap";
  if (utcHour >= 6 && utcHour < 7) return "Tokyo session";
  if (utcHour >= 7 && utcHour < 9) return "Tokyo + London + Frankfurt overlap";
  if (utcHour >= 9 && utcHour < 13) return "London + Frankfurt session";
  if (utcHour >= 13 && utcHour < 15) return "New York + London + Frankfurt overlap";
  if (utcHour >= 15 && utcHour < 16) return "New York + London + Frankfurt session";
  if (utcHour >= 16 && utcHour < 21) return "New York session";

  // 21:00–24:00
  if (utcHour >= 21) {
    // Friday: show nothing (already handled above)
    // Mon–Thu: "New York close / Sydney opens"
    if (utcDay >= 1 && utcDay <= 4) return "New York close / Sydney opens";
  }

  return "";
}

function SegmentBand({ segment }: { segment: TimeSegment }) {
  const { startHour, endHour } = segment;
  const left = (startHour / 24) * 100;
  const width = ((endHour - startHour) / 24) * 100;

  return (
    <div
      className="absolute top-0 h-full"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: segment.color,
      }}
      title={segment.label}
      data-testid={`segment-band-${segment.startHour}-${segment.endHour}`}
    />
  );
}

export function UtcRuler({ alerts = [] }: UtcRulerProps) {
  const [utcTime, setUtcTime] = useState<UtcTime>(getUtcTime);
  const [marketStatus, setMarketStatus] = useState(() => getMarketStatus());
  const labelInterval = useResponsiveLabelInterval();
  const isMobile = useIsMobile();

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcTime(getUtcTime());
      setMarketStatus(getMarketStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  const indicatorPosition = useMemo(
    () => getIndicatorPosition(utcTime),
    [utcTime]
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatTime = (h: number, m: number, s: number): string => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full" data-testid="utc-ruler">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="ruler-title" data-testid="text-utc-title">
          UTC Time
        </h2>
        <div className="flex items-center gap-2 md:gap-4">
          {getSessionLabel() && (
            <span
              className="ruler-session-label text-muted-foreground"
              data-testid="text-session-label"
            >
              {getSessionLabel()}
            </span>
          )}
          <div
            className="font-mono ruler-time-display font-medium tabular-nums"
            data-testid="text-utc-current-time"
          >
            {formatTime(utcTime.hours, utcTime.minutes, utcTime.seconds)} UTC
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {tradingSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-1.5 text-xs"
            data-testid={`legend-${session.id}`}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: session.color }}
            />
            <span className="text-muted-foreground">{session.label}</span>
          </div>
        ))}
      </div>

      <div className="relative pt-2">
        <div
          className="absolute z-30"
          style={{ left: `${indicatorPosition}%`, top: '0px', transform: 'translateX(-50%)' }}
        >
          <div className="current-time-triangle" />
        </div>
        
        <div
          className="relative h-12 bg-muted rounded-md overflow-hidden border"
          data-testid="ruler-track"
        >
          {(() => {
            const now = new Date();
            const isSunday = now.getUTCDay() === 0;
            const utcHour = now.getUTCHours();
            
            if (isSunday) {
              if (utcHour < 21) {
                return (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-5"
                    data-testid="market-closed-overlay"
                  >
                    <span className="text-muted-foreground font-medium text-lg">
                      Market closed
                    </span>
                  </div>
                );
              } else {
                const sydneyColor = "hsl(48 70% 75%)";
                const left = (21 / 24) * 100;
                const width = ((24 - 21) / 24) * 100;
                return (
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: sydneyColor,
                    }}
                    title="Sydney"
                    data-testid="segment-band-sunday-sydney"
                  />
                );
              }
            }
            
            if (marketStatus.isOpen) {
              return timeSegments.map((segment) => (
                <SegmentBand key={`${segment.startHour}-${segment.endHour}`} segment={segment} />
              ));
            }
            
            return (
              <div
                className="absolute inset-0 flex items-center justify-center z-5"
                data-testid="market-closed-overlay"
              >
                <span className="text-muted-foreground font-medium text-lg">
                  Market closed
                </span>
              </div>
            );
          })()}

          {alerts
            .filter((alert: AlertMarker) => alert.enabled)
            .map((alert: AlertMarker) => {
              const position = getAlertPosition(alert.utcHour, alert.utcMinute);
              return (
                <div
                  key={alert.id}
                  className="absolute top-0 h-full w-0.5 z-10 bg-black"
                  style={{ left: `${position}%` }}
                  title={`${alert.label} - ${alert.utcHour.toString().padStart(2, "0")}:${alert.utcMinute.toString().padStart(2, "0")} UTC`}
                  data-testid={`alert-marker-${alert.id}`}
                />
              );
            })}

          <div
            className="current-time-indicator"
            style={{ left: `${indicatorPosition}%` }}
            data-testid="utc-indicator"
          />
        </div>
      </div>

      <div className="relative h-8 mt-2" data-testid="ruler-labels">
        {hours.map((hour) => {
          const leftPosition = (hour / 24) * 100;
          const isEvenHour = hour % 2 === 0;
          const showLabel = hour % labelInterval === 0;
          
          // On mobile: show labels for even hours, minor ticks for odd hours
          // On desktop: show labels for all hours
          if (isMobile) {
            if (isEvenHour) {
              // Major tick with label (even hours)
              const labelIndex = Math.floor(hour / labelInterval);
              const isOdd = labelIndex % 2 === 1;
              return (
                <div
                  key={hour}
                  className={`absolute flex flex-col items-center ${isOdd ? 'hour-label-odd' : 'hour-label-even'}`}
                  style={{
                    left: `${leftPosition}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="w-px h-2 bg-border" />
                  <span
                    className="text-[9px] text-muted-foreground font-mono mt-0.5"
                    data-testid={`hour-label-${hour}`}
                  >
                    {hour.toString().padStart(2, "0")}
                  </span>
                </div>
              );
            } else {
              // Minor tick only (odd hours) - shorter than major, no label
              return (
                <div
                  key={hour}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${leftPosition}%`,
                    transform: "translateX(-50%)",
                  }}
                  data-testid={`minor-tick-${hour}`}
                >
                  <div className="w-px h-1.5 bg-muted-foreground/50" />
                </div>
              );
            }
          }
          
          // Desktop: show all hours with labels
          if (!showLabel) return null;
          return (
            <div
              key={hour}
              className="absolute flex flex-col items-center"
              style={{
                left: `${leftPosition}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="w-px h-2 bg-border" />
              <span
                className="text-[10px] text-muted-foreground font-mono mt-0.5"
                data-testid={`hour-label-${hour}`}
              >
                {hour.toString().padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
