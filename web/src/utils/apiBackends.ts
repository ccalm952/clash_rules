export type ApiBackend = {
  id: string;
  name: string;
  baseUrl: string;
};

const STORAGE_CUSTOM = "ccalm-rules-api-backends-custom-v1";
const STORAGE_SELECTED = "ccalm-rules-api-selected-v1";

export const BUILTIN_API_BACKENDS: ApiBackend[] = [
  {
    id: "asailor",
    name: "Aethersailor 公共 API",
    baseUrl: "https://api.asailor.org/sub",
  },
];

export function normalizeApiBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function nameFromApiUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function validateApiBaseUrl(url: string): string | null {
  const s = normalizeApiBaseUrl(url);
  if (!s) return "请填写后端地址";
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return "地址须以 http:// 或 https:// 开头";
    }
    return null;
  } catch {
    return "地址格式无效";
  }
}

function isValidStoredBackend(value: unknown): value is ApiBackend {
  if (typeof value !== "object" || value === null) return false;
  const b = value as ApiBackend;
  return (
    typeof b.id === "string" &&
    typeof b.name === "string" &&
    typeof b.baseUrl === "string" &&
    b.id.length > 0 &&
    b.name.trim().length > 0 &&
    validateApiBaseUrl(b.baseUrl) === null
  );
}

function loadCustomBackends(): ApiBackend[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidStoredBackend).map((b) => ({
      id: b.id,
      name: b.name.trim(),
      baseUrl: normalizeApiBaseUrl(b.baseUrl),
    }));
  } catch {
    return [];
  }
}

function saveCustomBackends(custom: ApiBackend[]) {
  localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(custom));
}

export function getAllApiBackends(): ApiBackend[] {
  return [...BUILTIN_API_BACKENDS, ...loadCustomBackends()];
}

export function getApiBackendById(id: string): ApiBackend | undefined {
  return getAllApiBackends().find((b) => b.id === id);
}

export function getSelectedApiId(): string {
  const stored = localStorage.getItem(STORAGE_SELECTED);
  if (stored && getApiBackendById(stored)) return stored;
  return BUILTIN_API_BACKENDS[0].id;
}

export function setSelectedApiId(id: string) {
  localStorage.setItem(STORAGE_SELECTED, id);
}

export function isBuiltinApiBackend(id: string): boolean {
  return BUILTIN_API_BACKENDS.some((b) => b.id === id);
}

export function addCustomApiBackend(baseUrl: string): { backend?: ApiBackend; error?: string } {
  const urlError = validateApiBaseUrl(baseUrl);
  if (urlError) return { error: urlError };

  const normalized = normalizeApiBaseUrl(baseUrl);
  const exists = getAllApiBackends().some((b) => normalizeApiBaseUrl(b.baseUrl) === normalized);
  if (exists) return { error: "该后端地址已存在" };

  const backend: ApiBackend = {
    id: crypto.randomUUID(),
    name: nameFromApiUrl(normalized),
    baseUrl: normalized,
  };
  saveCustomBackends([...loadCustomBackends(), backend]);
  return { backend };
}

export function removeCustomApiBackend(id: string): boolean {
  if (isBuiltinApiBackend(id)) return false;
  const next = loadCustomBackends().filter((b) => b.id !== id);
  if (next.length === loadCustomBackends().length) return false;
  saveCustomBackends(next);
  return true;
}
