"use client";

import type { ReactNode } from "react";

export interface ScaleMarker {
  id: string;
  label: string;
  value: string | number;
  labelClassName?: string;
  valueClassName?: string;
  bandAfterClassName?: string;
  bandAfterTooltip?: ReactNode;
}

interface PriceScaleBandProps {
  markers: ScaleMarker[];
}

interface PositionedScaleMarker extends ScaleMarker {
  position: number;
}

function markerAlignClass(position: number): string {
  if (position <= 10) return "translate-x-0 text-left";
  if (position >= 90) return "-translate-x-full text-right";
  return "-translate-x-1/2 text-center";
}

function normalizePosition(position: number): number {
  return Math.min(100, Math.max(0, position));
}

function markerNumericValue(value: ScaleMarker["value"]): number | null {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(value.trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function defaultPositions(count: number): number[] {
  if (count <= 1) return [0];

  return Array.from(
    { length: count },
    (_, index) => (index / (count - 1)) * 100,
  );
}

function ScaleMarkerLabel({
  label,
  value,
  position,
  labelClassName,
  valueClassName,
}: PositionedScaleMarker) {
  const clampedPosition = normalizePosition(position);

  return (
    <div
      className={`absolute top-0 ${markerAlignClass(clampedPosition)}`}
      style={{ left: `${clampedPosition}%` }}
    >
      <div className="flex flex-col">
        <span
          className={`text-base font-medium text-slate-800 ${valueClassName ?? ""}`}
        >
          {value}
        </span>
        <span
          className={`text-xs font-medium text-slate-500 ${labelClassName ?? ""}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function BandSegment({
  start,
  end,
  className,
  tooltip,
}: {
  start: number;
  end: number;
  className?: string;
  tooltip?: ReactNode;
}) {
  const left = Math.min(normalizePosition(start), normalizePosition(end));
  const right = Math.max(normalizePosition(start), normalizePosition(end));
  const width = right - left;

  if (width <= 0) return null;

  return (
    <div
      className="group absolute top-1/2 h-7 w-full -translate-y-1/2 outline-none"
      style={{ left: `${left + 0.1}%`, width: `${width - 0.2}%` }}
      tabIndex={tooltip ? 0 : undefined}
    >
      <div
        className={`absolute top-1/2 left-0 h-3 w-full -translate-y-1/2 rounded-xs transition-all duration-50 group-hover:h-4 ${className ?? "bg-slate-400/50"} `}
      />
      {tooltip ? (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-max max-w-56 -translate-x-1/2 rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-left opacity-0 shadow-sm backdrop-blur-md transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100">
          {tooltip}
        </div>
      ) : null}
    </div>
  );
}

export function PriceScaleBand({ markers }: PriceScaleBandProps) {
  const numericValues = markers.map((marker) =>
    markerNumericValue(marker.value),
  );
  const hasCompleteScale = numericValues.every((value) => value != null);
  const positions = (() => {
    if (!hasCompleteScale) return defaultPositions(markers.length);

    const values = numericValues as number[];
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    return values.map((value) => ((value - minValue) / range) * 100);
  })();

  const positionedMarkers: PositionedScaleMarker[] = markers.map(
    (marker, index) => ({
      ...marker,
      position: positions[index] ?? 0,
    }),
  );

  return (
    <div className="px-5 pt-2">
      <div className="relative h-11">
        {positionedMarkers.map((marker) => (
          <ScaleMarkerLabel key={marker.id} {...marker} />
        ))}
      </div>

      <div className="relative mb-2 h-4">
        {positionedMarkers.slice(0, -1).map((marker, index) => (
          <BandSegment
            key={`${marker.id}-${positionedMarkers[index + 1]?.id ?? "end"}`}
            start={marker.position}
            end={positionedMarkers[index + 1]?.position ?? marker.position}
            className={marker.bandAfterClassName}
            tooltip={marker.bandAfterTooltip}
          />
        ))}
      </div>
    </div>
  );
}
