export class ApiError extends Error {
  status: number;
  url: string;
  body: unknown;

  constructor(input: { message: string; status: number; url: string; body: unknown }) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.url = input.url;
    this.body = input.body;
  }
}

export type ApiQuery = Record<string, string | number | boolean | null | undefined>;

export type ApiClientConfig = {
  baseUrl?: string;
  pathPrefix?: string;
  defaultHeaders?: HeadersInit;
  fetchImpl?: typeof fetch;
};

type RequestOptions = {
  query?: ApiQuery;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

type JsonRequestOptions = RequestOptions & {
  body?: unknown;
};

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function trimLeadingSlashes(value: string) {
  return value.replace(/^\/+/, "");
}

function joinPath(prefix: string, path: string) {
  const p = `/${trimLeadingSlashes(prefix || "")}`;
  const s = `/${trimLeadingSlashes(path || "")}`;
  return `${trimTrailingSlashes(p)}${s}`;
}

function buildQueryString(query?: ApiQuery) {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function resolveUrl(input: { baseUrl: string; pathPrefix: string; path: string; query?: ApiQuery }) {
  const prefix = input.pathPrefix || "/api";
  const pathname = joinPath(prefix, input.path);
  const qs = buildQueryString(input.query);
  const base = (input.baseUrl || "").trim();
  if (!base) return `${pathname}${qs}`;
  return `${trimTrailingSlashes(base)}${pathname}${qs}`;
}

async function readResponseBody(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json().catch(() => null);
  }
  return await res.text().catch(() => null);
}

export function createApiClient(config?: ApiClientConfig) {
  const baseUrl = config?.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const pathPrefix = config?.pathPrefix ?? process.env.NEXT_PUBLIC_API_PATH_PREFIX ?? "/api";
  const defaultHeaders = config?.defaultHeaders;
  const fetchImpl = config?.fetchImpl ?? fetch;

  async function requestJson<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options?: JsonRequestOptions
  ): Promise<T> {
    const url = resolveUrl({ baseUrl, pathPrefix, path, query: options?.query });
    const headers: HeadersInit = {
      ...(defaultHeaders || {}),
      ...(options?.headers || {}),
    };
    const init: RequestInit = { method, headers, signal: options?.signal };
    if (options && "body" in options) {
      (init.headers as Record<string, string>)["Content-Type"] =
        (init.headers as Record<string, string>)["Content-Type"] || "application/json";
      init.body = options.body === undefined ? undefined : JSON.stringify(options.body);
    }

    const res = await fetchImpl(url, init);
    const body = await readResponseBody(res);
    if (!res.ok) {
      throw new ApiError({
        message: `API request failed (${res.status})`,
        status: res.status,
        url,
        body,
      });
    }
    return body as T;
  }

  async function requestBlob(path: string, options?: RequestOptions): Promise<Blob> {
    const url = resolveUrl({ baseUrl, pathPrefix, path, query: options?.query });
    const res = await fetchImpl(url, {
      method: "GET",
      headers: { ...(defaultHeaders || {}), ...(options?.headers || {}) },
      signal: options?.signal,
    });
    if (!res.ok) {
      const body = await readResponseBody(res);
      throw new ApiError({
        message: `API request failed (${res.status})`,
        status: res.status,
        url,
        body,
      });
    }
    return await res.blob();
  }

  return {
    getJson: <T>(path: string, options?: RequestOptions) => requestJson<T>("GET", path, options),
    postJson: <T>(path: string, options?: JsonRequestOptions) => requestJson<T>("POST", path, options),
    getBlob: (path: string, options?: RequestOptions) => requestBlob(path, options),
  };
}

export const api = createApiClient();

