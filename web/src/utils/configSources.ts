export type ConfigSourceItem = {
  id: string;
  label: string;
  url: string;
  description?: string;
};

const STORAGE_OVERRIDES = "ccalm-rules-config-sources-overrides-v1";
const STORAGE_SELECTED = "ccalm-rules-config-selected-v1";

/** 唯一允许编辑 rules.ini 地址的内置来源 */
export const EDITABLE_CONFIG_SOURCE_ID = "github";

export const BUILTIN_CONFIG_SOURCES: ConfigSourceItem[] = [
  {
    id: "testingcf",
    label: "testingcf 加速",
    url: "https://testingcf.jsdelivr.net/gh/ccalm952/ccalm-rules@main/rules.ini",
    description: "推荐",
  },
  {
    id: "fastly",
    label: "Fastly 代理",
    url: "https://fastly.jsdelivr.net/gh/ccalm952/ccalm-rules@main/rules.ini",
    description: "fastly.jsdelivr.net",
  },
  {
    id: "cdn",
    label: "jsDelivr CDN",
    url: "https://cdn.jsdelivr.net/gh/ccalm952/ccalm-rules@main/rules.ini",
    description: "cdn.jsdelivr.net",
  },
  {
    id: "github",
    label: "GitHub 源站",
    url: "https://raw.githubusercontent.com/ccalm952/ccalm-rules/refs/heads/main/rules.ini",
    description: "raw.githubusercontent.com",
  },
];

type ConfigOverride = Partial<Pick<ConfigSourceItem, "label" | "url" | "description">>;

export function normalizeConfigUrl(raw: string): string {
  return raw.trim();
}

export function validateConfigUrl(url: string): string | null {
  const s = normalizeConfigUrl(url);
  if (!s) return "请填写 rules.ini 地址";
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

function loadOverrides(): Record<string, ConfigOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_OVERRIDES);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const all = parsed as Record<string, ConfigOverride>;
    const github = all[EDITABLE_CONFIG_SOURCE_ID];
    if (!github?.url) return {};
    return { [EDITABLE_CONFIG_SOURCE_ID]: { url: normalizeConfigUrl(github.url) } };
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, ConfigOverride>) {
  localStorage.setItem(STORAGE_OVERRIDES, JSON.stringify(overrides));
}

function applyOverride(item: ConfigSourceItem, override?: ConfigOverride): ConfigSourceItem {
  if (!override) return item;
  return {
    ...item,
    label: override.label?.trim() || item.label,
    url: override.url ? normalizeConfigUrl(override.url) : item.url,
    description:
      override.description !== undefined
        ? override.description.trim() || undefined
        : item.description,
  };
}

export function getAllConfigSources(): ConfigSourceItem[] {
  const overrides = loadOverrides();
  return BUILTIN_CONFIG_SOURCES.map((b) =>
    b.id === EDITABLE_CONFIG_SOURCE_ID ? applyOverride(b, overrides[b.id]) : b,
  );
}

export function isEditableConfigSource(id: string): boolean {
  return id === EDITABLE_CONFIG_SOURCE_ID;
}

export function getConfigSourceById(id: string): ConfigSourceItem | undefined {
  return getAllConfigSources().find((s) => s.id === id);
}

export function getSelectedConfigSourceId(): string {
  const stored = localStorage.getItem(STORAGE_SELECTED);
  if (stored && getConfigSourceById(stored)) return stored;
  return BUILTIN_CONFIG_SOURCES[0].id;
}

export function setSelectedConfigSourceId(id: string) {
  localStorage.setItem(STORAGE_SELECTED, id);
}

export function isBuiltinConfigSource(id: string): boolean {
  return BUILTIN_CONFIG_SOURCES.some((s) => s.id === id);
}

export function getDefaultGithubIniUrl(): string {
  return BUILTIN_CONFIG_SOURCES.find((s) => s.id === EDITABLE_CONFIG_SOURCE_ID)!.url;
}

export function isGithubIniOverridden(): boolean {
  const current = getConfigSourceById(EDITABLE_CONFIG_SOURCE_ID);
  return current?.url !== getDefaultGithubIniUrl();
}

function urlExists(url: string, excludeId?: string): boolean {
  const normalized = normalizeConfigUrl(url);
  return getAllConfigSources().some(
    (s) => s.id !== excludeId && normalizeConfigUrl(s.url) === normalized,
  );
}

export function updateGithubIniUrl(url: string): { error?: string } {
  const urlError = validateConfigUrl(url);
  if (urlError) return { error: urlError };

  const normalized = normalizeConfigUrl(url);
  if (urlExists(normalized, EDITABLE_CONFIG_SOURCE_ID)) {
    return { error: "该 rules.ini 地址已存在" };
  }

  const overrides = loadOverrides();
  if (normalized === getDefaultGithubIniUrl()) {
    delete overrides[EDITABLE_CONFIG_SOURCE_ID];
  } else {
    overrides[EDITABLE_CONFIG_SOURCE_ID] = { url: normalized };
  }
  saveOverrides(overrides);
  return {};
}

export function resetConfigSource(id: string): boolean {
  if (!isEditableConfigSource(id)) return false;
  const overrides = loadOverrides();
  if (!overrides[id]) return false;
  delete overrides[id];
  saveOverrides(overrides);
  return true;
}
