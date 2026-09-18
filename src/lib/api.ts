export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
  code: string;
  fields?: Record<string, string[]>;
  status: number;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.fields = error.fields;
    this.status = status;
  }
}

async function requete(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<{ data: unknown; meta: Record<string, unknown> }> {
  // FormData (upload de fichier, ex. preuve de livraison) : ne pas
  // JSON.stringify ni poser Content-Type nous-mêmes — le navigateur pose la
  // frontière multipart correcte automatiquement.
  const estFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    cache: "no-store",
    headers: {
      ...(estFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: estFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    const error: ApiError = json?.error ?? {
      code: "SERVER_ERROR",
      message: "Une erreur est survenue, réessayez.",
    };

    throw new ApiRequestError(error, response.status);
  }

  return { data: json.data, meta: json.meta ?? {} };
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const { data } = await requete(path, options);
  return data as T;
}

export async function apiFetchAvecMeta<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const { data, meta } = await requete(path, options);
  return { data: data as T, meta };
}
