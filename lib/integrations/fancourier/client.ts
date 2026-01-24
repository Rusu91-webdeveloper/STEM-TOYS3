/**
 * FAN Courier API Client
 *
 * Implements FAN Courier SelfAWB API integration.
 * Reference: https://www.fancourier.ro/en/e-commerce/selfawb-integration/
 *
 * Authentication: Bearer token with 24-hour lifespan
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

const DEFAULT_TOKEN_TTL_SECONDS = 86400; // 24 hours per FAN API docs

const getBaseUrl = (): string => {
    const baseUrl = process.env.FANCOURIER_BASE_URL;
    if (!baseUrl) {
        throw new FanCourierClientError("FANCOURIER_BASE_URL is not configured");
    }
    return baseUrl.replace(/\/+$/, "");
};

const getCredentials = (): {
    clientId: string;
    username: string;
    password: string;
} => {
    const clientId = process.env.FANCOURIER_CLIENT_ID;
    const username = process.env.FANCOURIER_USERNAME;
    const password = process.env.FANCOURIER_PASSWORD;

    if (!clientId || !username || !password) {
        throw new FanCourierClientError(
            "FANCOURIER_CLIENT_ID, FANCOURIER_USERNAME, or FANCOURIER_PASSWORD missing"
        );
    }

    return { clientId, username, password };
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

/**
 * Get authentication token from FAN Courier
 */
export const getFanCourierToken = async (): Promise<string> => {
    // Return cached token if still valid (with 5 min buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
        return cachedToken.token;
    }

    const baseUrl = getBaseUrl();
    const { clientId, username, password } = getCredentials();

    const data = await fetchJson(`${baseUrl}/auth/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            username,
            password,
        }),
    });

    const token = data.token as string;
    if (!token) {
        throw new FanCourierClientError(
            "Authentication token missing in FAN response"
        );
    }

    const expiresIn = (data.expires_in as number) || DEFAULT_TOKEN_TTL_SECONDS;

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
    const baseUrl = getBaseUrl();
    const token = await getFanCourierToken();
    const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    return fetchJson(url, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(init.headers || {}),
        },
    });
};

/**
 * Create AWB via FAN Courier API
 */
export const createFanCourierAwb = async (
    payload: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    return fanCourierRequest("/awb/internal", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Check if FAN response indicates extra km or remote locality
 * This is critical for preventing financial losses from undercharging
 */
export const hasExtraKmOrRemoteLocality = (
    response: Record<string, unknown>
): { hasExtraKm: boolean; reason: string | null } => {
    // Check various response patterns from FAN API
    const extraKm = response.extra_km || response.extraKm || response.extraKM;
    const remoteLocality =
        response.remote_locality ||
        response.remoteLocality ||
        response.remoteLocation;
    const outOfNetwork =
        response.out_of_network || response.outOfNetwork || response.outsideNetwork;
    const message = (response.message || response.info || "") as string;

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
 * Clear cached token (useful for testing or token refresh)
 */
export const clearTokenCache = (): void => {
    cachedToken = null;
};
