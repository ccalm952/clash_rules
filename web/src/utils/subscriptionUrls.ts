import { normalizeSubUrl } from "./genSubUrl";

export type SubscriptionItem = {
  id: string;
  name: string;
  url: string;
};

const STORAGE_LIST = "ccalm-rules-subscriptions-v1";
const STORAGE_SELECTED = "ccalm-rules-sub-selected-v1";

function nameFromSubUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function validateSubscriptionUrl(raw: string): string | null {
  const s = normalizeSubUrl(raw);
  if (!s) return "请填写订阅链接";
  if (!/^https?:\/\//i.test(s)) {
    return "订阅链接应以 http:// 或 https:// 开头";
  }
  return null;
}

function isValidStoredSubscription(value: unknown): value is SubscriptionItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as SubscriptionItem;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.url === "string" &&
    item.id.length > 0 &&
    item.name.trim().length > 0 &&
    validateSubscriptionUrl(item.url) === null
  );
}

function loadSubscriptions(): SubscriptionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_LIST);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidStoredSubscription).map((item) => ({
      id: item.id,
      name: item.name.trim(),
      url: normalizeSubUrl(item.url),
    }));
  } catch {
    return [];
  }
}

function saveSubscriptions(items: SubscriptionItem[]) {
  localStorage.setItem(STORAGE_LIST, JSON.stringify(items));
}

export function getAllSubscriptions(): SubscriptionItem[] {
  return loadSubscriptions();
}

export function getSubscriptionById(id: string): SubscriptionItem | undefined {
  return loadSubscriptions().find((item) => item.id === id);
}

export function getSelectedSubscriptionId(): string {
  const items = loadSubscriptions();
  const stored = localStorage.getItem(STORAGE_SELECTED);
  if (stored && items.some((item) => item.id === stored)) return stored;
  return items[0]?.id ?? "";
}

export function setSelectedSubscriptionId(id: string) {
  localStorage.setItem(STORAGE_SELECTED, id);
}

export function getSelectedSubscriptionUrl(): string {
  const id = getSelectedSubscriptionId();
  return getSubscriptionById(id)?.url ?? "";
}

export function addSubscription(rawUrl: string): { item?: SubscriptionItem; error?: string } {
  const urlError = validateSubscriptionUrl(rawUrl);
  if (urlError) return { error: urlError };

  const normalized = normalizeSubUrl(rawUrl);
  const exists = loadSubscriptions().some((item) => normalizeSubUrl(item.url) === normalized);
  if (exists) return { error: "该订阅链接已存在" };

  const item: SubscriptionItem = {
    id: crypto.randomUUID(),
    name: nameFromSubUrl(normalized),
    url: normalized,
  };
  saveSubscriptions([...loadSubscriptions(), item]);
  return { item };
}

export function removeSubscription(id: string): boolean {
  const prev = loadSubscriptions();
  const next = prev.filter((item) => item.id !== id);
  if (next.length === prev.length) return false;
  saveSubscriptions(next);
  const selected = localStorage.getItem(STORAGE_SELECTED);
  if (selected === id) {
    const fallback = next[0]?.id ?? "";
    if (fallback) localStorage.setItem(STORAGE_SELECTED, fallback);
    else localStorage.removeItem(STORAGE_SELECTED);
  }
  return true;
}
