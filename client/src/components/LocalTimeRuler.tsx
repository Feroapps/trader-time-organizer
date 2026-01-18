import { useEffect, useState, useMemo } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AlertMarker } from "./UtcRuler";

interface LocalTimeRulerProps {
  alerts?: AlertMarker[];
}

interface LocalTime {
  hours: number;
  minutes: number;
  seconds: number;
  timezoneOffset: number;
}

function getLocalTime(): LocalTime {
  const now = new Date();
  return {
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    timezoneOffset: now.getTimezoneOffset(),
  };
}

function getIndicatorPosition(time: LocalTime): number {
  const totalMinutes = time.hours * 60 + time.minutes + time.seconds / 60;
  return (totalMinutes / (24 * 60)) * 100;
}

function utcHourToLocalHour(utcHour: number): number {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60;
  let localHour = utcHour + offsetHours;
  if (localHour < 0) localHour += 24;
  if (localHour >= 24) localHour -= 24;
  return Math.floor(localHour);
}

function getAlertPosition(utcHour: number, utcMinute: number): number {
  const totalMinutes = utcHour * 60 + utcMinute;
  return (totalMinutes / (24 * 60)) * 100;
}

function formatHour(hour: number, use24Hour: boolean): string {
  if (use24Hour) {
    return hour.toString().padStart(2, "0");
  }
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}${period}`;
}

function formatTime(h: number, m: number, s: number, use24Hour: boolean): string {
  if (use24Hour) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")} ${period}`;
}

function getTimezoneLabel(): string {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60;
  const sign = offsetHours >= 0 ? "+" : "";
  const absOffset = Math.abs(offsetHours);
  const wholeHours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - wholeHours) * 60);
  
  if (minutes === 0) {
    return `UTC${sign}${wholeHours}`;
  }
  return `UTC${sign}${wholeHours}:${minutes.toString().padStart(2, "0")}`;
}

export function LocalTimeRuler({ alerts = [] }: LocalTimeRulerProps) {
  const [localTime, setLocalTime] = useState<LocalTime>(getLocalTime);
  const [use24Hour, setUse24Hour] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(getLocalTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const indicatorPosition = useMemo(
    () => getIndicatorPosition(localTime),
    [localTime]
  );

  const timezoneLabel = useMemo(() => getTimezoneLabel(), []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const localHourLabels = useMemo(() => {
    return hours.map((utcHour) => {
      const localHour = utcHourToLocalHour(utcHour);
      return {
        utcHour,
        localHour,
        label: formatHour(localHour, use24Hour),
      };
    });
  }, [use24Hour]);

  return (
    <div className="w-full" data-testid="local-time-ruler">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-xl font-semibold" data-testid="text-local-title">
          Local Time <span className="text-sm font-normal text-muted-foreground">({timezoneLabel})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="font-mono text-2xl font-medium tabular-nums"
            data-testid="text-local-current-time"
          >
            {formatTime(localTime.hours, localTime.minutes, localTime.seconds, use24Hour)}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setUse24Hour(!use24Hour)}
                data-testid="button-toggle-time-format"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Switch to {use24Hour ? "12-hour" : "24-hour"} format</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="relative pt-2">
        <div
          className="absolute z-30"
          style={{ left: `${indicatorPosition}%`, top: '0px', transform: 'translateX(-50%)' }}
        >
          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[6px] border-l-transparent border-r-transparent border-t-black" />
        </div>
        
        <div
          className="relative h-12 bg-muted rounded-md overflow-hidden border"
          data-testid="local-ruler-track"
        >
          {alerts
            .filter((alert) => alert.enabled)
            .map((alert) => {
              const position = getAlertPosition(alert.utcHour, alert.utcMinute);
              return (
                <div
                  key={alert.id}
                  className="absolute top-0 h-full w-0.5 z-10"
                  style={{ left: `${position}%`, backgroundColor: '#2DFF6A' }}
                  data-testid={`local-alert-marker-${alert.id}`}
                />
              );
            })}

          <div
            className="absolute top-0 h-full w-0.5 bg-black z-20 transition-all duration-1000 ease-linear"
            style={{ left: `${indicatorPosition}%` }}
            data-testid="local-indicator"
          />
        </div>
      </div>

      <div className="relative h-6 mt-1" data-testid="local-ruler-labels">
        {localHourLabels.map(({ utcHour, localHour, label }) => {
          const leftPosition = (utcHour / 24) * 100;
          const isMajorLabel = utcHour % 3 === 0;
          const minorLabel = formatHour(localHour, use24Hour);
          return (
            <div
              key={utcHour}
              className="absolute flex flex-col items-center"
              style={{
                left: `${leftPosition}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="w-px h-2 bg-border" />
              {isMajorLabel ? (
                <span
                  className="text-xs text-muted-foreground font-mono mt-0.5"
                  data-testid={`local-hour-label-${utcHour}`}
                >
                  {label}
                </span>
              ) : (
                <span
                  className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5"
                  data-testid={`local-hour-label-minor-${utcHour}`}
                >
                  {minorLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
