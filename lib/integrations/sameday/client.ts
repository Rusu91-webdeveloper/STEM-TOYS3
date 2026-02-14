type AuthToken = {
  token: string;
  expiresAt: number;
};

export class SamedayClientError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "SamedayClientError";
    this.status = status;
  }
}

const DEFAULT_TOKEN_TTL_SECONDS = 3600;

const getBaseUrl = () => {
  const baseUrl = process.env.SAMEDAY_BASE_URL;
  if (!baseUrl) {
    throw new SamedayClientError("SAMEDAY_BASE_URL is not configured");
  }
  return baseUrl.replace(/\/+$/, "");
};

const getAuthHeaders = () => {
  const username = process.env.SAMEDAY_USERNAME;
  const password = process.env.SAMEDAY_PASSWORD;
  if (!username || !password) {
    throw new SamedayClientError("SAMEDAY_USERNAME or SAMEDAY_PASSWORD missing");
  }
  return {
    "X-AUTH-USERNAME": username,
    "X-AUTH-PASSWORD": password,
  };
};

const getTokenHeaderName = () =>
  process.env.SAMEDAY_TOKEN_HEADER || "X-AUTH-TOKEN";

let cachedToken: AuthToken | null = null;

const resolveToken = (data: Record<string, unknown>): AuthToken => {
  const nested = data.data as Record<string, unknown> | undefined;
  const tokenCandidate = data.token ?? data.access_token ?? nested?.token;
  const token = typeof tokenCandidate === "string" ? tokenCandidate : undefined;
  if (!token) {
    throw new SamedayClientError("Authentication token missing in response");
  }

  const expiresInRaw =
    (data.expires_in as number | string | undefined) || nested?.expires_in;
  const parsedExpiresIn =
    typeof expiresInRaw === "string"
      ? Number.parseInt(expiresInRaw, 10)
      : typeof expiresInRaw === "number"
        ? expiresInRaw
        : DEFAULT_TOKEN_TTL_SECONDS;
  const expiresIn = Number.isFinite(parsedExpiresIn)
    ? parsedExpiresIn
    : DEFAULT_TOKEN_TTL_SECONDS;

  return {
    token,
    expiresAt: Date.now() + Math.max(300, expiresIn) * 1000,
  };
};

const fetchJson = async (
  url: string,
  init: RequestInit
): Promise<Record<string, unknown>> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new SamedayClientError(
      `Sameday request failed (${response.status}): ${text || response.statusText}`,
      response.status
    );
  }
  return (await response.json()) as Record<string, unknown>;
};

export const getSamedayToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const baseUrl = getBaseUrl();
  const authHeaders = getAuthHeaders();
  const url = `${baseUrl}/api/authentication`;

  const data = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  });

  cachedToken = resolveToken(data);
  return cachedToken.token;
};

export const samedayRequest = async (
  path: string,
  init: RequestInit = {}
): Promise<Record<string, unknown>> => {
  const baseUrl = getBaseUrl();
  const token = await getSamedayToken();
  const tokenHeader = getTokenHeaderName();
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  return fetchJson(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      [tokenHeader]: token,
    },
  });
};

export const createSamedayAwb = async (
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const path = process.env.SAMEDAY_CREATE_AWB_PATH;
  if (!path) {
    throw new SamedayClientError(
      "SAMEDAY_CREATE_AWB_PATH is not configured"
    );
  }

  return samedayRequest(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
