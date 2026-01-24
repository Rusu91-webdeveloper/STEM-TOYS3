import { samedayRequest } from "./client";

type CacheEntry = {
  expiresAt: number;
  data: Record<string, unknown>;
};

const cache = new Map<string, CacheEntry>();

const getTtlMs = () => {
  const ttlMinutes = Number.parseInt(
    process.env.SAMEDAY_REFERENCE_TTL_MINUTES || "1440",
    10
  );
  return Math.max(5, ttlMinutes) * 60 * 1000;
};

const fetchWithCache = async (key: string, path?: string) => {
  if (!path) {
    throw new Error(`Sameday reference path for ${key} is not configured`);
  }

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await samedayRequest(path, { method: "GET" });
  cache.set(key, { data, expiresAt: Date.now() + getTtlMs() });
  return data;
};

export const getSamedayPickupPoints = async () =>
  fetchWithCache("pickupPoints", process.env.SAMEDAY_PICKUP_POINTS_PATH);

export const getSamedayServices = async () =>
  fetchWithCache("services", process.env.SAMEDAY_SERVICES_PATH);

export const getSamedayCounties = async () =>
  fetchWithCache("counties", process.env.SAMEDAY_COUNTIES_PATH);

export const getSamedayCities = async () =>
  fetchWithCache("cities", process.env.SAMEDAY_CITIES_PATH);
