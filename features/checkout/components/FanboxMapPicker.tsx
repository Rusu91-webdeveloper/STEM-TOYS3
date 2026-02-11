"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import type { FanboxPickupPoint } from "../lib/checkoutApi";

type FanboxMapPickerProps = {
  points: FanboxPickupPoint[];
  selectedId?: string;
  countyHint?: string;
  localityHint?: string;
  onSelect: (point: FanboxPickupPoint) => void;
};

type FanboxWidgetOptions = {
  rootNode?: Element;
  rootId?: string;
  county?: string;
  locality?: string;
  adresa?: string;
  pickUpPoint?: unknown;
  callback?: (item: unknown) => void;
};

declare global {
  interface Window {
    LoadMapFanBox?: (options: FanboxWidgetOptions) => void;
  }
}

type WidgetStatus = "idle" | "loading" | "ready" | "error";

const FANBOX_WIDGET_SCRIPT_ID = "fancourier-fanbox-widget-script";
const FANBOX_WIDGET_SCRIPT_SRC =
  process.env.NEXT_PUBLIC_FANCOURIER_WIDGET_SRC ||
  "https://unpkg.com/map-fanbox-points@latest/umd/map-fanbox-points.js";

function normalize(input: string): string {
  return input
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function formatAddress(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";

  const address = value as Record<string, unknown>;
  const street =
    asText(address.street) ||
    asText(address.streetName) ||
    asText(address.fullAddress) ||
    asText(address.full_address);
  const number =
    asText(address.streetNo) ||
    asText(address.street_no) ||
    asText(address.number);
  const details = asText(address.details) || asText(address.description);

  const line = [street, number ? `nr. ${number}` : ""]
    .filter(Boolean)
    .join(" ");
  return [line, details].filter(Boolean).join(", ");
}

const COUNTY_CODE_TO_NAME: Record<string, string> = {
  AB: "Alba",
  AR: "Arad",
  AG: "Arges",
  BC: "Bacau",
  BH: "Bihor",
  BN: "Bistrita-Nasaud",
  BT: "Botosani",
  BV: "Brasov",
  BR: "Braila",
  B: "Bucuresti",
  BUCURESTI: "Bucuresti",
  IF: "Ilfov",
  BZ: "Buzau",
  CS: "Caras-Severin",
  CL: "Calarasi",
  CJ: "Cluj",
  CT: "Constanta",
  CV: "Covasna",
  DB: "Dambovita",
  DJ: "Dolj",
  GL: "Galati",
  GR: "Giurgiu",
  GJ: "Gorj",
  HR: "Harghita",
  HD: "Hunedoara",
  IL: "Ialomita",
  IS: "Iasi",
  MM: "Maramures",
  MH: "Mehedinti",
  MS: "Mures",
  NT: "Neamt",
  OT: "Olt",
  PH: "Prahova",
  SJ: "Salaj",
  SM: "Satu Mare",
  SB: "Sibiu",
  SV: "Suceava",
  TR: "Teleorman",
  TM: "Timis",
  TL: "Tulcea",
  VL: "Valcea",
  VS: "Vaslui",
  VN: "Vrancea",
};

function normalizeCountyForWidget(value: string | undefined): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  return COUNTY_CODE_TO_NAME[upper] || raw;
}

function isBenignAbortReason(reason: unknown): boolean {
  if (reason instanceof DOMException && reason.name === "AbortError") {
    return true;
  }
  if (reason instanceof Error) {
    return (
      reason.name === "AbortError" ||
      /signal is aborted without reason/i.test(reason.message)
    );
  }
  if (typeof reason === "string") {
    return /signal is aborted without reason|aborterror/i.test(reason);
  }
  return false;
}

function extractWidgetPoint(
  item: unknown,
  points: FanboxPickupPoint[]
): FanboxPickupPoint | null {
  if (!item || typeof item !== "object") return null;
  const payload = item as Record<string, unknown>;

  const idCandidates = [
    asText(payload.pickupPointId),
    asText(payload.pickupPointID),
    asText(payload.pick_up_point_id),
    asText(payload.pickUpPointId),
    asText(payload.id),
    asText(payload.code),
  ].filter(Boolean);

  for (const candidate of idCandidates) {
    const existing = points.find(point => point.id === candidate);
    if (existing) return existing;
  }

  const name =
    asText(payload.pickUpPoint) ||
    asText(payload.pickupPoint) ||
    asText(payload.pickupPointName) ||
    asText(payload.name);
  const locality =
    asText(payload.locality) ||
    asText(payload.city) ||
    asText(payload.localityName);
  const address =
    asText(payload.adresa) ||
    asText(payload.address) ||
    asText(payload.street) ||
    asText(payload.fullAddress);
  const postalCode =
    asText(payload.postalCode) ||
    asText(payload.postal_code) ||
    asText(payload.zipCode);
  const latitude =
    asNumber(payload.latitude) ??
    asNumber(payload.lat) ??
    asNumber(payload.coordY) ??
    asNumber(payload.coordy);
  const longitude =
    asNumber(payload.longitude) ??
    asNumber(payload.lng) ??
    asNumber(payload.lon) ??
    asNumber(payload.coordX) ??
    asNumber(payload.coordx);

  const normalizedName = normalize(name);
  const normalizedLocality = normalize(locality);
  const normalizedAddress = normalize(address);

  const fuzzyMatch = points.find(point => {
    const pointName = normalize(point.name);
    const pointLocality = normalize(point.locality);
    const pointAddress = normalize(formatAddress(point.address as unknown));

    const nameMatches =
      normalizedName &&
      (pointName === normalizedName ||
        pointName.includes(normalizedName) ||
        normalizedName.includes(pointName));

    const localityMatches =
      !normalizedLocality ||
      !pointLocality ||
      pointLocality === normalizedLocality ||
      pointLocality.includes(normalizedLocality) ||
      normalizedLocality.includes(pointLocality);

    const addressMatches =
      !normalizedAddress ||
      !pointAddress ||
      pointAddress.includes(normalizedAddress) ||
      normalizedAddress.includes(pointAddress);

    return nameMatches && localityMatches && addressMatches;
  });

  if (fuzzyMatch) return fuzzyMatch;

  // Keep submit flow safe: only accept points from the current backend list.
  void postalCode;
  void latitude;
  void longitude;
  return null;
}

function loadFanboxWidgetScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.LoadMapFanBox) return Promise.resolve();

  const existing = document.getElementById(
    FANBOX_WIDGET_SCRIPT_ID
  ) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.LoadMapFanBox) {
        resolve();
        return;
      }

      const handleLoad = () => {
        if (window.LoadMapFanBox) resolve();
        else
          reject(
            new Error("FANbox widget loaded but LoadMapFanBox is missing")
          );
      };
      const handleError = () =>
        reject(new Error("Failed to load FANbox widget script"));

      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = FANBOX_WIDGET_SCRIPT_ID;
    script.src = FANBOX_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.LoadMapFanBox) resolve();
      else reject(new Error("LoadMapFanBox unavailable after script load"));
    };
    script.onerror = () =>
      reject(new Error("Failed to fetch FANbox widget script"));
    document.head.appendChild(script);
  });
}

export function FanboxMapPicker({
  points,
  selectedId,
  countyHint,
  localityHint,
  onSelect,
}: FanboxMapPickerProps) {
  const [search, setSearch] = useState("");
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus>("idle");
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const rootNodeRef = useRef<HTMLDivElement | null>(null);
  const rootIdRef = useRef(
    `fanbox-widget-${Math.random().toString(36).slice(2)}`
  );
  const lastWidgetKeyRef = useRef<string>("");

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return points;
    return points.filter(point => {
      const addressText = formatAddress(point.address as unknown);
      const text = normalize(
        `${point.name} ${point.locality} ${point.county} ${addressText} ${point.postalCode}`
      );
      return text.includes(q);
    });
  }, [points, search]);

  const visibleList = filtered.slice(0, 200);

  const handleWidgetSelection = useCallback(
    (item: unknown) => {
      const selected = extractWidgetPoint(item, points);
      if (!selected) return;
      onSelect(selected);
      setWidgetError(null);
    },
    [onSelect, points]
  );

  const renderOfficialWidget = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.LoadMapFanBox || !rootNodeRef.current) return;

    // Prefer resolved pickup-point location values over raw address hints.
    const county = points[0]?.county || normalizeCountyForWidget(countyHint);
    const locality = points[0]?.locality || localityHint || "";
    const adresa = "";
    const renderKey = `${normalize(county)}|${normalize(locality)}|${points.length}`;

    // Prevent redundant re-initialization loops from triggering widget abort noise.
    if (lastWidgetKeyRef.current === renderKey) {
      return;
    }

    try {
      rootNodeRef.current.innerHTML = "";
      window.LoadMapFanBox({
        rootNode: rootNodeRef.current,
        rootId: rootIdRef.current,
        county: county || undefined,
        locality: locality || undefined,
        adresa: adresa || undefined,
        callback: item => {
          handleWidgetSelection(item);
        },
      });
      lastWidgetKeyRef.current = renderKey;
      setWidgetError(null);
    } catch (error) {
      console.error("Failed to initialize FANbox official widget:", error);
      setWidgetStatus("error");
      setWidgetError(
        "Nu am putut încărca harta oficială FAN Courier. Poți selecta FANbox-ul din listă."
      );
    }
  }, [countyHint, localityHint, points, handleWidgetSelection]);

  useEffect(() => {
    let active = true;
    setWidgetStatus("loading");

    loadFanboxWidgetScript()
      .then(() => {
        if (!active) return;
        setWidgetStatus("ready");
      })
      .catch(error => {
        if (!active) return;
        console.error("FANbox widget script load failed:", error);
        setWidgetStatus("error");
        setWidgetError(
          "Nu am putut încărca widget-ul oficial FAN Courier. Selectează FANbox-ul din listă."
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (widgetStatus !== "ready" || points.length === 0) return;
    renderOfficialWidget();
  }, [widgetStatus, points, renderOfficialWidget]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isBenignAbortReason(event.reason)) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<{ item?: unknown }>;
      if (customEvent.detail?.item) {
        handleWidgetSelection(customEvent.detail.item);
      }
    };

    window.addEventListener("map:select-point", listener as EventListener);
    return () => {
      window.removeEventListener("map:select-point", listener as EventListener);
    };
  }, [handleWidgetSelection]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/20 bg-slate-950/30 p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100">
            Hartă oficială FAN Courier
          </p>
          <button
            type="button"
            onClick={() => {
              if (widgetStatus === "ready") {
                renderOfficialWidget();
                return;
              }

              setWidgetError(null);
              setWidgetStatus("loading");
              loadFanboxWidgetScript()
                .then(() => {
                  setWidgetStatus("ready");
                })
                .catch(error => {
                  console.error("FANbox widget reload failed:", error);
                  setWidgetStatus("error");
                  setWidgetError(
                    "Nu am putut încărca widget-ul oficial FAN Courier. Selectează FANbox-ul din listă."
                  );
                });
            }}
            className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={widgetStatus === "loading"}
          >
            Reîncarcă harta
          </button>
        </div>
        <div
          id={rootIdRef.current}
          ref={rootNodeRef}
          className="h-[360px] overflow-hidden rounded-lg border border-white/10 bg-slate-900/60"
        />
        {widgetStatus === "loading" && (
          <p className="mt-2 text-xs text-slate-300">
            Se încarcă widget-ul oficial FAN Courier...
          </p>
        )}
        {widgetError && (
          <p className="mt-2 text-xs text-amber-200">{widgetError}</p>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={event => setSearch(event.target.value)}
        placeholder="Caută FANbox după nume sau adresă"
        className="w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-300 focus:border-sky-300 focus:outline-none"
      />

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/30 p-2">
        {visibleList.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-300">
            Nu există rezultate pentru căutarea ta.
          </p>
        ) : (
          visibleList.map(point => {
            const active = point.id === selectedId;
            const addressText = formatAddress(point.address as unknown);
            return (
              <button
                key={point.id}
                type="button"
                onClick={() => onSelect(point)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left transition",
                  active
                    ? "border-emerald-300/60 bg-emerald-500/15 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-100 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{point.name}</p>
                  <span className="text-[10px] uppercase tracking-wide text-slate-300">
                    list
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-200">
                  {point.locality}, {point.county}
                </p>
                {addressText && (
                  <p className="mt-0.5 text-xs text-slate-300">{addressText}</p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
