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

const getClientId = (): number => {
    const clientId = process.env.FANCOURIER_CLIENT_ID;
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
    const username = process.env.FANCOURIER_USERNAME;
    const password = process.env.FANCOURIER_PASSWORD;

    if (!username || !password) {
        throw new FanCourierClientError(
            "FANCOURIER_USERNAME or FANCOURIER_PASSWORD missing"
        );
    }

    return { username, password };
};

let cachedToken: AuthToken | null = null;

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

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
    };

    if (!headers["Content-Type"] && init.body) {
        headers["Content-Type"] = "application/json";
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
    return !!(
        process.env.FANCOURIER_BASE_URL &&
        process.env.FANCOURIER_CLIENT_ID &&
        process.env.FANCOURIER_USERNAME &&
        process.env.FANCOURIER_PASSWORD
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
