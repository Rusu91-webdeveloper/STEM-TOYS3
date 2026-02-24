/**
 * FAN Courier API Client
 *
 * Implements FAN Courier SelfAWB API integration.
 * Authentication: Bearer token obtained via /login.
 */

type AuthToken = {
    token: string;
    expiresAt: number;
};

type FanboxPickupPoint = {
    id: string;
    name: string;
    county: string;
    locality: string;
    address: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    raw?: Record<string, unknown>;
};

export class FanCourierClientError extends Error {
    status?: number;
    code?: string;

    constructor(message: string, status?: number, code?: string) {
        super(message);
        this.name = "FanCourierClientError";
        this.status = status;
        this.code = code;
    }
}

const DEFAULT_TOKEN_TTL_SECONDS = 86400; // Fallback if API doesn't provide expiry

const getBaseUrl = (): string => {
    const baseUrl = process.env.FANCOURIER_BASE_URL;
    if (!baseUrl) {
        throw new FanCourierClientError("FANCOURIER_BASE_URL is not configured");
    }
    return baseUrl.replace(/\/+$/, "");
};

const useOccasionalFanCourierAccount = (): boolean =>
    process.env.FANCOURIER_USE_OCCASIONAL_ACCOUNT === "true";

const getClientId = (): number => {
    const clientId = useOccasionalFanCourierAccount()
        ? process.env.FANCOURIER_OCCASIONAL_CLIENT_ID || process.env.FANCOURIER_CLIENT_ID
        : process.env.FANCOURIER_CLIENT_ID;
    if (!clientId) {
        throw new FanCourierClientError("FANCOURIER_CLIENT_ID missing");
    }
    const parsed = Number(clientId);
    if (!Number.isFinite(parsed)) {
        throw new FanCourierClientError("FANCOURIER_CLIENT_ID must be a number");
    }
    return parsed;
};

const getAuthCredentials = (): {
    username: string;
    password: string;
} => {
    const username = useOccasionalFanCourierAccount()
        ? process.env.FANCOURIER_OCCASIONAL_USERNAME || process.env.FANCOURIER_USERNAME
        : process.env.FANCOURIER_USERNAME;
    const password = useOccasionalFanCourierAccount()
        ? process.env.FANCOURIER_OCCASIONAL_PASSWORD || process.env.FANCOURIER_PASSWORD
        : process.env.FANCOURIER_PASSWORD;

    if (!username || !password) {
        throw new FanCourierClientError(
            "FANCOURIER_USERNAME or FANCOURIER_PASSWORD missing"
        );
    }

    return { username, password };
};

let cachedToken: AuthToken | null = null;
let cachedFanboxPoints: { expiresAt: number; points: FanboxPickupPoint[] } | null =
    null;

const fetchJson = async (
    url: string,
    init: RequestInit
): Promise<Record<string, unknown>> => {
    const response = await fetch(url, init);

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new FanCourierClientError(
            `FAN Courier request failed (${response.status}): ${text || response.statusText}`,
            response.status
        );
    }

    return (await response.json()) as Record<string, unknown>;
};

const fanCourierFetch = async (
    path: string,
    init: RequestInit = {}
): Promise<Response> => {
    const baseUrl = getBaseUrl();
    const token = await getFanCourierToken();
    const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    if (!headers.has("Content-Type") && init.body) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
        ...init,
        headers,
    });
};

/**
 * Get authentication token from FAN Courier
 */
export const getFanCourierToken = async (): Promise<string> => {
    // Return cached token if still valid (with 5 min buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
        return cachedToken.token;
    }

    const baseUrl = getBaseUrl();
    const { username, password } = getAuthCredentials();

    const url = new URL(`${baseUrl}/login`);
    url.searchParams.set("username", username);
    url.searchParams.set("password", password);

    const data = await fetchJson(url.toString(), {
        method: "POST",
    });

    const token =
        (data.token as string) ||
        ((data.data as Record<string, unknown> | undefined)?.token as string);
    if (!token) {
        throw new FanCourierClientError(
            "Authentication token missing in FAN response"
        );
    }

    const expiresIn =
        ((data.expires_in as number) ||
            ((data.data as Record<string, unknown> | undefined)
                ?.expires_in as number) ||
            DEFAULT_TOKEN_TTL_SECONDS);

    cachedToken = {
        token,
        expiresAt: Date.now() + expiresIn * 1000,
    };

    return cachedToken.token;
};

/**
 * Make authenticated request to FAN Courier API
 */
export const fanCourierRequest = async (
    path: string,
    init: RequestInit = {}
): Promise<Record<string, unknown>> => {
    const response = await fanCourierFetch(path, init);
    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new FanCourierClientError(
            `FAN Courier request failed (${response.status}): ${text || response.statusText}`,
            response.status
        );
    }
    return (await response.json()) as Record<string, unknown>;
};

const fanCourierRequestBinary = async (
    path: string,
    init: RequestInit = {}
): Promise<{ buffer: ArrayBuffer; contentType: string | null }> => {
    const response = await fanCourierFetch(path, init);
    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new FanCourierClientError(
            `FAN Courier request failed (${response.status}): ${text || response.statusText}`,
            response.status
        );
    }
    return {
        buffer: await response.arrayBuffer(),
        contentType: response.headers.get("content-type"),
    };
};

/**
 * Create AWB via FAN Courier API
 */
export const createFanCourierAwb = async (
    payload: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    return fanCourierRequest("/intern-awb", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Create a pickup order via FAN Courier API
 */
export const createFanCourierPickupOrder = async (
    payload: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    return fanCourierRequest("/order", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Download AWB label as PDF (base64 handled by caller)
 */
export const getFanCourierAwbLabel = async (input: {
    awbNumber: string;
    dpi?: number;
}): Promise<{ buffer: ArrayBuffer; contentType: string | null }> => {
    const clientId = getClientId();
    const dpi = input.dpi ?? 300;
    const query = new URLSearchParams();
    query.set("clientId", String(clientId));
    query.append("awbs[]", input.awbNumber);
    query.set("pdf", "1");
    query.set("dpi", String(dpi));

    return fanCourierRequestBinary(`/awb/label?${query.toString()}`, {
        method: "GET",
    });
};

/**
 * Check if FAN response indicates extra km or remote locality
 * This is critical for preventing financial losses from undercharging
 */
export const hasExtraKmOrRemoteLocality = (
    response: Record<string, unknown>
): { hasExtraKm: boolean; reason: string | null } => {
    const data = response.data as Record<string, unknown> | undefined;
    const shipments = response.shipments as Array<Record<string, unknown>> | undefined;
    const shipment = shipments?.[0];

    // Check various response patterns from FAN API
    const extraKm =
        response.extra_km ||
        response.extraKm ||
        response.extraKM ||
        data?.extra_km ||
        data?.extraKm ||
        shipment?.extra_km ||
        shipment?.extraKm;
    const remoteLocality =
        response.remote_locality ||
        response.remoteLocality ||
        response.remoteLocation ||
        data?.remote_locality ||
        data?.remoteLocality ||
        shipment?.remote_locality ||
        shipment?.remoteLocality;
    const outOfNetwork =
        response.out_of_network ||
        response.outOfNetwork ||
        response.outsideNetwork ||
        data?.out_of_network ||
        data?.outOfNetwork ||
        shipment?.out_of_network ||
        shipment?.outOfNetwork;
    const message = (response.message ||
        response.info ||
        data?.message ||
        data?.info ||
        shipment?.message ||
        "") as string;

    const hasExtraKm =
        !!extraKm ||
        !!remoteLocality ||
        !!outOfNetwork ||
        message.toLowerCase().includes("extra km") ||
        message.toLowerCase().includes("localitate indepartată") ||
        message.toLowerCase().includes("in afara retelei") ||
        message.toLowerCase().includes("outside network");

    return {
        hasExtraKm,
        reason: hasExtraKm
            ? message || "Extra km or remote locality detected"
            : null,
    };
};

/**
 * Check if FAN Courier is configured
 */
export const isFanCourierConfigured = (): boolean => {
    const hasClientId = useOccasionalFanCourierAccount()
        ? !!(process.env.FANCOURIER_OCCASIONAL_CLIENT_ID || process.env.FANCOURIER_CLIENT_ID)
        : !!process.env.FANCOURIER_CLIENT_ID;
    const hasUsername = useOccasionalFanCourierAccount()
        ? !!(process.env.FANCOURIER_OCCASIONAL_USERNAME || process.env.FANCOURIER_USERNAME)
        : !!process.env.FANCOURIER_USERNAME;
    const hasPassword = useOccasionalFanCourierAccount()
        ? !!(process.env.FANCOURIER_OCCASIONAL_PASSWORD || process.env.FANCOURIER_PASSWORD)
        : !!process.env.FANCOURIER_PASSWORD;

    return !!(
        process.env.FANCOURIER_BASE_URL &&
        hasClientId &&
        hasUsername &&
        hasPassword
    );
};

/**
 * Get FAN Courier client ID from environment.
 */
export const getFanCourierClientId = (): number => {
    return getClientId();
};

/**
 * Clear cached token (useful for testing or token refresh)
 */
export const clearTokenCache = (): void => {
    cachedToken = null;
};

const normalize = (value: unknown): string =>
    String(value ?? "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase();

const COUNTY_CODE_MAP: Record<string, string> = {
    AB: "alba",
    AR: "arad",
    AG: "arges",
    BC: "bacau",
    BH: "bihor",
    BN: "bistrita nasaud",
    BT: "botosani",
    BV: "brasov",
    BR: "braila",
    B: "bucuresti",
    BUCURESTI: "bucuresti",
    IF: "ilfov",
    BZ: "buzau",
    CS: "caras severin",
    CL: "calarasi",
    CJ: "cluj",
    CT: "constanta",
    CV: "covasna",
    DB: "dambovita",
    DJ: "dolj",
    GL: "galati",
    GR: "giurgiu",
    GJ: "gorj",
    HR: "harghita",
    HD: "hunedoara",
    IL: "ialomita",
    IS: "iasi",
    MM: "maramures",
    MH: "mehedinti",
    MS: "mures",
    NT: "neamt",
    OT: "olt",
    PH: "prahova",
    SJ: "salaj",
    SM: "satu mare",
    SB: "sibiu",
    SV: "suceava",
    TR: "teleorman",
    TM: "timis",
    TL: "tulcea",
    VL: "valcea",
    VS: "vaslui",
    VN: "vrancea",
};

const normalizeCountyInput = (value: unknown): string => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const upper = raw.toUpperCase();
    if (COUNTY_CODE_MAP[upper]) {
        return COUNTY_CODE_MAP[upper];
    }
    return normalize(raw);
};

const COUNTY_CANONICAL_NAME_MAP: Record<string, string> = {
    alba: "Alba",
    arad: "Arad",
    arges: "Arges",
    bacau: "Bacau",
    bihor: "Bihor",
    "bistrita nasaud": "Bistrita-Nasaud",
    botosani: "Botosani",
    brasov: "Brasov",
    braila: "Braila",
    bucuresti: "Bucuresti",
    buzau: "Buzau",
    "caras severin": "Caras-Severin",
    calarasi: "Calarasi",
    cluj: "Cluj",
    constanta: "Constanta",
    covasna: "Covasna",
    dambovita: "Dambovita",
    dolj: "Dolj",
    galati: "Galati",
    giurgiu: "Giurgiu",
    gorj: "Gorj",
    harghita: "Harghita",
    hunedoara: "Hunedoara",
    ialomita: "Ialomita",
    iasi: "Iasi",
    ilfov: "Ilfov",
    maramures: "Maramures",
    mehedinti: "Mehedinti",
    mures: "Mures",
    neamt: "Neamt",
    olt: "Olt",
    prahova: "Prahova",
    salaj: "Salaj",
    "satu mare": "Satu Mare",
    sibiu: "Sibiu",
    suceava: "Suceava",
    teleorman: "Teleorman",
    timis: "Timis",
    tulcea: "Tulcea",
    valcea: "Valcea",
    vaslui: "Vaslui",
    vrancea: "Vrancea",
};

export const normalizeFanCourierCountyName = (value: unknown): string => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";

    // FAN examples use "Bucuresti" even when the source stores sector details.
    if (/^bucuresti/i.test(raw)) {
        return "Bucuresti";
    }

    const normalized = normalizeCountyInput(raw);
    if (COUNTY_CANONICAL_NAME_MAP[normalized]) {
        return COUNTY_CANONICAL_NAME_MAP[normalized];
    }

    return raw;
};

const toArray = (input: unknown): Record<string, unknown>[] => {
    if (Array.isArray(input)) {
        return input.filter(item => item && typeof item === "object") as Record<
            string,
            unknown
        >[];
    }
    return [];
};

const extractFanboxRows = (payload: Record<string, unknown>): Record<string, unknown>[] => {
    const directArray = toArray(payload);
    if (directArray.length > 0) return directArray;

    const data = payload.data as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const rowsFromDataArray = toArray(data);
    if (rowsFromDataArray.length > 0) return rowsFromDataArray;

    if (data && typeof data === "object") {
        const dataRecord = data as Record<string, unknown>;
        const nestedCandidates = [
            dataRecord.items,
            dataRecord.rows,
            dataRecord.results,
            dataRecord.pickupPoints,
            dataRecord.pickup_points,
        ];

        for (const candidate of nestedCandidates) {
            const nestedArray = toArray(candidate);
            if (nestedArray.length > 0) return nestedArray;
        }
    }

    const topLevelCandidates = [
        payload.items,
        payload.rows,
        payload.results,
        payload.pickupPoints,
        payload.pickup_points,
    ];
    for (const candidate of topLevelCandidates) {
        const nestedArray = toArray(candidate);
        if (nestedArray.length > 0) return nestedArray;
    }

    return [];
};

const parseNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const normalized = value.replace(",", ".");
        const parsed = Number.parseFloat(normalized);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
};

const parseCoordinates = (row: Record<string, unknown>): {
    latitude?: number;
    longitude?: number;
} => {
    const rowAddress =
        row.address && typeof row.address === "object"
            ? (row.address as Record<string, unknown>)
            : null;

    const latitude =
        parseNumber(row.latitude) ??
        parseNumber(row.lat) ??
        parseNumber(rowAddress?.latitude) ??
        parseNumber(rowAddress?.lat);
    const longitude =
        parseNumber(row.longitude) ??
        parseNumber(row.lng) ??
        parseNumber(row.lon) ??
        parseNumber(rowAddress?.longitude) ??
        parseNumber(rowAddress?.lng) ??
        parseNumber(rowAddress?.lon);

    // Some payloads expose coordinates as [lng, lat]
    if (
        (!latitude || !longitude) &&
        Array.isArray(row.coordinates) &&
        row.coordinates.length >= 2
    ) {
        const lng = parseNumber(row.coordinates[0]);
        const lat = parseNumber(row.coordinates[1]);
        if (lat && lng) {
            return { latitude: lat, longitude: lng };
        }
    }

    return { latitude, longitude };
};

const asText = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    return "";
};

const formatAddressObject = (value: Record<string, unknown>): string => {
    const streetLine =
        asText(value.street) ||
        asText(value.streetName) ||
        asText(value.fullAddress) ||
        asText(value.full_address) ||
        asText(value.addressLine1) ||
        asText(value.line1);

    const streetNumber =
        asText(value.streetNo) ||
        asText(value.street_no) ||
        asText(value.number) ||
        asText(value.no);

    const building =
        asText(value.building) ||
        asText(value.block) ||
        asText(value.scara) ||
        asText(value.stair) ||
        asText(value.floor) ||
        asText(value.apartment) ||
        asText(value.ap);

    const details =
        asText(value.details) ||
        asText(value.description) ||
        asText(value.note);

    const firstLine = [streetLine, streetNumber ? `nr. ${streetNumber}` : "", building]
        .filter(Boolean)
        .join(" ");

    return [firstLine, details].filter(Boolean).join(", ");
};

const extractAddressText = (
    row: Record<string, unknown>,
    rowAddress: Record<string, unknown> | null
): string => {
    const directAddress = row.address;
    if (typeof directAddress === "string" || typeof directAddress === "number") {
        const text = asText(directAddress);
        if (text) return text;
    }

    if (directAddress && typeof directAddress === "object") {
        const text = formatAddressObject(directAddress as Record<string, unknown>);
        if (text) return text;
    }

    const candidates = [
        row.street,
        row.fullAddress,
        row.full_address,
        row.description,
        rowAddress?.street,
        rowAddress?.fullAddress,
        rowAddress?.full_address,
        rowAddress?.description,
    ];

    for (const candidate of candidates) {
        const text =
            candidate && typeof candidate === "object"
                ? formatAddressObject(candidate as Record<string, unknown>)
                : asText(candidate);
        if (text) return text;
    }

    return "";
};

const normalizeFanboxPoint = (
    row: Record<string, unknown>
): FanboxPickupPoint | null => {
    const rowAddress =
        row.address && typeof row.address === "object"
            ? (row.address as Record<string, unknown>)
            : null;
    const coords = parseCoordinates(row);

    const id =
        row.id ||
        row.ID ||
        row.pickupPointID ||
        row.pickupPointId ||
        row.pickup_point_id ||
        row.pickupPointCode ||
        row.pickup_point_code ||
        row.lockerId ||
        row.locker_id ||
        row.code ||
        row.uid;
    const name =
        row.name ||
        row.pickupPointName ||
        row.pickup_point_name ||
        row.locationName ||
        row.location_name ||
        row.lockerName ||
        row.locker_name ||
        row.pickupPoint ||
        row.pickup_point ||
        row.title ||
        row.label;
    const county =
        row.county ||
        row.judet ||
        row.region ||
        row.countyName ||
        row.county_name ||
        rowAddress?.county ||
        rowAddress?.judet ||
        rowAddress?.region ||
        rowAddress?.countyName;
    const locality =
        row.locality ||
        row.city ||
        row.oras ||
        row.town ||
        row.location ||
        row.localityName ||
        row.locality_name ||
        row.cityName ||
        row.city_name ||
        rowAddress?.locality ||
        rowAddress?.city ||
        rowAddress?.oras ||
        rowAddress?.town ||
        rowAddress?.location;
    const address = extractAddressText(row, rowAddress);
    const postalCode =
        row.zipCode ||
        row.postalCode ||
        row.zip_code ||
        row.postal_code ||
        rowAddress?.zipCode ||
        rowAddress?.postalCode ||
        rowAddress?.zip_code ||
        rowAddress?.postal_code ||
        "";

    if (!id || !name) {
        return null;
    }

    return {
        id: String(id),
        name: String(name),
        county: String(county || ""),
        locality: String(locality || ""),
        address,
        postalCode: String(postalCode || ""),
        latitude: coords.latitude,
        longitude: coords.longitude,
        raw: row,
    };
};

const getFanboxCacheTtlMs = (): number => {
    const ttlMinutes = Number.parseInt(
        process.env.FANCOURIER_FANBOX_CACHE_MINUTES || "30",
        10
    );
    return Math.max(5, ttlMinutes) * 60 * 1000;
};

const fetchRawFanboxPoints = async (): Promise<Record<string, unknown>[]> => {
    const requests = ["/reports/pickup-points?type=fanbox", "/pickup-points?type=fanbox"];
    let lastError: unknown;

    for (const path of requests) {
        try {
            const payload = await fanCourierRequest(path, { method: "GET" });
            const rows = extractFanboxRows(payload);
            if (rows.length > 0) {
                return rows;
            }
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError instanceof Error) {
        throw lastError;
    }
    return [];
};

export const getFanCourierFanboxPickupPoints = async (input?: {
    county?: string;
    locality?: string;
    postalCode?: string;
    search?: string;
}): Promise<FanboxPickupPoint[]> => {
    if (
        !cachedFanboxPoints ||
        cachedFanboxPoints.expiresAt <= Date.now() ||
        cachedFanboxPoints.points.length === 0
    ) {
        const rows = await fetchRawFanboxPoints();
        const points = rows
            .map(normalizeFanboxPoint)
            .filter((point): point is FanboxPickupPoint => Boolean(point));

        cachedFanboxPoints = {
            points,
            expiresAt: Date.now() + getFanboxCacheTtlMs(),
        };
    }

    const points = cachedFanboxPoints.points;
    const countyNeedle = normalizeCountyInput(input?.county);
    const localityNeedle = normalize(input?.locality);
    const postalNeedle = normalize(input?.postalCode);
    const searchNeedle = normalize(input?.search);
    const filtered = points.filter(point => {
        const pointCounty = normalize(point.county);
        const pointLocality = normalize(point.locality);
        const pointPostal = normalize(point.postalCode);
        const pointAddress = normalize(point.address);
        const pointName = normalize(point.name);

        const countyMatches =
            !countyNeedle ||
            pointCounty.includes(countyNeedle) ||
            countyNeedle.includes(pointCounty);
        const localityMatches =
            !localityNeedle ||
            pointLocality.includes(localityNeedle) ||
            localityNeedle.includes(pointLocality);
        const postalMatches =
            !postalNeedle ||
            !pointPostal ||
            pointPostal.includes(postalNeedle) ||
            postalNeedle.includes(pointPostal);
        const searchMatches =
            !searchNeedle ||
            pointName.includes(searchNeedle) ||
            pointAddress.includes(searchNeedle) ||
            pointLocality.includes(searchNeedle) ||
            pointCounty.includes(searchNeedle);

        return countyMatches && localityMatches && postalMatches && searchMatches;
    });

    if (filtered.length > 0) {
        return filtered;
    }

    // Fallback: keep address relevance but relax strict county/postal matching.
    return points.filter(point => {
        const pointCounty = normalize(point.county);
        const pointLocality = normalize(point.locality);
        const pointAddress = normalize(point.address);
        const pointName = normalize(point.name);

        const localityMatches =
            !localityNeedle ||
            pointLocality.includes(localityNeedle) ||
            localityNeedle.includes(pointLocality);
        const countyMatches =
            !countyNeedle ||
            pointCounty.includes(countyNeedle) ||
            countyNeedle.includes(pointCounty);
        const searchMatches =
            !searchNeedle ||
            pointName.includes(searchNeedle) ||
            pointAddress.includes(searchNeedle) ||
            pointLocality.includes(searchNeedle);

        return localityMatches && countyMatches && searchMatches;
    });
};

const findObjectArrays = (
    value: unknown,
    maxDepth = 4,
    depth = 0
): Array<{ path: string; length: number; sampleKeys: string[] }> => {
    if (depth > maxDepth || value === null || value === undefined) return [];

    if (Array.isArray(value)) {
        const firstObject = value.find(
            item => item && typeof item === "object" && !Array.isArray(item)
        ) as Record<string, unknown> | undefined;
        const sampleKeys = firstObject ? Object.keys(firstObject).slice(0, 12) : [];
        return [
            {
                path: "array",
                length: value.length,
                sampleKeys,
            },
        ];
    }

    if (typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    const result: Array<{ path: string; length: number; sampleKeys: string[] }> = [];
    for (const [key, nested] of Object.entries(record)) {
        const nestedResult = findObjectArrays(nested, maxDepth, depth + 1);
        for (const item of nestedResult) {
            result.push({
                path: `${key}.${item.path}`,
                length: item.length,
                sampleKeys: item.sampleKeys,
            });
        }
    }
    return result;
};

export const debugFanCourierFanboxPickupPoints = async (): Promise<{
    attempts: Array<{
        path: string;
        ok: boolean;
        extractedRows: number;
        topLevelKeys: string[];
        discoveredArrays: Array<{ path: string; length: number; sampleKeys: string[] }>;
        error?: string;
    }>;
}> => {
    const attempts: Array<{
        path: string;
        ok: boolean;
        extractedRows: number;
        topLevelKeys: string[];
        discoveredArrays: Array<{ path: string; length: number; sampleKeys: string[] }>;
        error?: string;
    }> = [];

    const paths = ["/reports/pickup-points?type=fanbox", "/pickup-points?type=fanbox"];
    for (const path of paths) {
        try {
            const payload = await fanCourierRequest(path, { method: "GET" });
            const extracted = extractFanboxRows(payload);
            attempts.push({
                path,
                ok: true,
                extractedRows: extracted.length,
                topLevelKeys: Object.keys(payload).slice(0, 20),
                discoveredArrays: findObjectArrays(payload).slice(0, 20),
            });
        } catch (error) {
            attempts.push({
                path,
                ok: false,
                extractedRows: 0,
                topLevelKeys: [],
                discoveredArrays: [],
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return { attempts };
};
