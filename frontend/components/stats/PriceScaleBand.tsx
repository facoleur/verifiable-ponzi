"use client";

export interface ScaleMarker {
  id: string;
  label: string;
  value: string | number;
  position: number;
  labelClassName?: string;
  valueClassName?: string;
  tickClassName?: string;
}

export interface ScaleBand {
  id: string;
  start: number;
  end: number;
  className?: string;
}

interface PriceScaleBandProps {
  markers: ScaleMarker[];
  bands: ScaleBand[];
}

function markerAlignClass(position: number): string {
  if (position <= 10) return "translate-x-0 text-left";
  if (position >= 90) return "-translate-x-full text-right";
  return "-translate-x-1/2 text-center";
}

function normalizePosition(position: number): number {
  return Math.min(100, Math.max(0, position));
}

function ScaleMarkerLabel({
  label,
  value,
  position,
  labelClassName,
  valueClassName,
}: ScaleMarker) {
  const clampedPosition = normalizePosition(position);

  return (
    <div
      className={`absolute top-0 ${markerAlignClass(clampedPosition)}`}
      style={{ left: `${clampedPosition}%` }}
    >
      <div className="flex flex-col">
        <span
          className={`text-xs font-medium text-slate-600 ${labelClassName ?? ""}`}
        >
          {label}
        </span>
        <span
          className={`text-base font-medium text-slate-800 ${valueClassName ?? ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function ScaleMarkerTick({
  position,
  tickClassName,
}: Pick<ScaleMarker, "position" | "tickClassName">) {
  const clampedPosition = normalizePosition(position);

  return (
    <div
      className={`absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-slate-800 ${tickClassName ?? ""}`}
      style={{ left: `${clampedPosition}%` }}
    />
  );
}

function BandSegment({ start, end, className }: ScaleBand) {
  const left = Math.min(normalizePosition(start), normalizePosition(end));
  const right = Math.max(normalizePosition(start), normalizePosition(end));
  const width = right - left;

  if (width <= 0) return null;

  return (
    <div
      className={`absolute hover:bg-slate-400/65 top-1/2 h-3 -translate-y-1/2 rounded-xs transition-all duration-25 hover:h-5 ${className ?? "bg-slate-400/50"}`}
      style={{ left: `${left + 0.1}%`, width: `${width - 0.2}%` }}
    />
  );
}

export function PriceScaleBand({ markers, bands }: PriceScaleBandProps) {
  return (
    <div className="px-5 pt-2">
      <div className="relative h-12">
        {markers.map((marker) => (
          <ScaleMarkerLabel key={marker.id} {...marker} />
        ))}
      </div>

      <div className="relative mb-2 h-4">
        {bands.map((band) => (
          <BandSegment key={band.id} {...band} />
        ))}
        {/* {markers.map((marker) => (
          <ScaleMarkerTick
            key={`${marker.id}-tick`}
            position={marker.position}
            tickClassName={marker.tickClassName}
          />
        ))} */}
      </div>
    </div>
  );
}
