import { useEffect, useState, useMemo, useRef } from "react";
import { tradingSessions, timeSegments, type TradingSession, type TimeSegment } from "@/data/sessionSchedule";
import { getMarketStatus } from "@/utils/marketHours";

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

// COLOR_PREVIEW_MODE (temporary)
const COLOR_PREVIEW_MODE = true;

export function UtcRuler({ alerts = [] }: UtcRulerProps) {
  const [utcTime, setUtcTime] = useState<UtcTime>(getUtcTime);
  const [marketStatus, setMarketStatus] = useState(() => getMarketStatus());
  const lastLoggedIsOpen = useRef<boolean | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcTime(getUtcTime());
      setMarketStatus(getMarketStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastLoggedIsOpen.current !== marketStatus.isOpen) {
      console.log("WEEKEND_LOGIC_APPLIED");
      lastLoggedIsOpen.current = marketStatus.isOpen;
    }
  }, [marketStatus.isOpen]);

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
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold" data-testid="text-utc-title">
          UTC Time
        </h2>
        <div
          className="font-mono text-2xl font-medium tabular-nums"
          data-testid="text-utc-current-time"
        >
          {formatTime(utcTime.hours, utcTime.minutes, utcTime.seconds)} UTC
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

      <div
        className="relative h-12 bg-muted rounded-md overflow-hidden border"
        data-testid="ruler-track"
      >
        {(COLOR_PREVIEW_MODE || marketStatus.isOpen) && timeSegments.map((segment) => (
          <SegmentBand key={`${segment.startHour}-${segment.endHour}`} segment={segment} />
        ))}

        {!COLOR_PREVIEW_MODE && !marketStatus.isOpen && (
          <div
            className="absolute inset-0 flex items-center justify-center z-5"
            data-testid="market-closed-overlay"
          >
            <span className="text-muted-foreground font-medium text-lg">
              Market closed
            </span>
          </div>
        )}

        {marketStatus.isOpen && alerts
          .filter((alert: AlertMarker) => alert.enabled)
          .map((alert: AlertMarker) => {
            const position = getAlertPosition(alert.utcHour, alert.utcMinute);
            return (
              <div
                key={alert.id}
                className="absolute top-0 h-full w-0.5 bg-destructive z-10"
                style={{ left: `${position}%` }}
                title={`${alert.label} - ${alert.utcHour.toString().padStart(2, "0")}:${alert.utcMinute.toString().padStart(2, "0")} UTC`}
                data-testid={`alert-marker-${alert.id}`}
              />
            );
          })}

        <div
          className="absolute top-0 h-full w-0.5 bg-primary z-20 transition-all duration-1000 ease-linear"
          style={{ left: `${indicatorPosition}%` }}
          data-testid="utc-indicator"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
        </div>
      </div>

      <div className="relative h-6 mt-1" data-testid="ruler-labels">
        {hours.map((hour) => {
          const leftPosition = (hour / 24) * 100;
          const showLabel = hour % 3 === 0;
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
              {showLabel && (
                <span
                  className="text-xs text-muted-foreground font-mono mt-0.5"
                  data-testid={`hour-label-${hour}`}
                >
                  {hour.toString().padStart(2, "0")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
