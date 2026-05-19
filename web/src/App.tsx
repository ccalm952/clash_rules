import { useState } from "react";
import {
  ActivityIcon,
  CheckIcon,
  CopyIcon,
  LinkIcon,
  PencilIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  addCustomApiBackend,
  getAllApiBackends,
  getApiBackendById,
  getSelectedApiId,
  isBuiltinApiBackend,
  removeCustomApiBackend,
  setSelectedApiId,
  type ApiBackend,
} from "@/utils/apiBackends";
import {
  EDITABLE_CONFIG_SOURCE_ID,
  getAllConfigSources,
  getSelectedConfigSourceId,
  isGithubIniOverridden,
  resetConfigSource,
  setSelectedConfigSourceId,
  updateGithubIniUrl,
  type ConfigSourceItem,
} from "@/utils/configSources";
import { buildSubConverterUrl } from "@/utils/genSubUrl";
import {
  formatProbeResult,
  probeAllConfigSources,
  type ConfigProbeResult,
} from "@/utils/probeConfig";
import { formatSubProbeResult, probeAllSubscriptions, type SubProbeResult } from "@/utils/probeSub";
import {
  addSubscription,
  getAllSubscriptions,
  getSelectedSubscriptionId,
  removeSubscription,
  setSelectedSubscriptionId,
  type SubscriptionItem,
} from "@/utils/subscriptionUrls";

export default function App() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() =>
    getAllSubscriptions(),
  );
  const [selectedSubId, setSelectedSubIdState] = useState(() => getSelectedSubscriptionId());
  const [newSubUrl, setNewSubUrl] = useState("");
  const [apiBackends, setApiBackends] = useState<ApiBackend[]>(() => getAllApiBackends());
  const [selectedApiId, setSelectedApiIdState] = useState(() => getSelectedApiId());
  const [newApiUrl, setNewApiUrl] = useState("");
  const [configSources, setConfigSources] = useState<ConfigSourceItem[]>(() =>
    getAllConfigSources(),
  );
  const [configSourceId, setConfigSourceIdState] = useState(() => getSelectedConfigSourceId());
  const [editingGithub, setEditingGithub] = useState(false);
  const [editGithubIniUrl, setEditGithubIniUrl] = useState("");
  const [includeKeywords, setIncludeKeywords] = useState<string[]>(["美国", "香港"]);
  const [newIncludeKeyword, setNewIncludeKeyword] = useState("");
  const [output, setOutput] = useState("");
  const [probes, setProbes] = useState<Partial<Record<string, ConfigProbeResult>>>({});
  const [probing, setProbing] = useState(false);
  const [subProbes, setSubProbes] = useState<Partial<Record<string, SubProbeResult>>>({});
  const [subProbing, setSubProbing] = useState(false);

  const selectedApi = getApiBackendById(selectedApiId) ?? apiBackends[0];
  const selectedSubUrl = subscriptions.find((s) => s.id === selectedSubId)?.url ?? "";

  const refreshSubscriptions = () => {
    setSubscriptions(getAllSubscriptions());
    setSelectedSubIdState(getSelectedSubscriptionId());
  };

  const handleSelectSub = (id: string) => {
    setSelectedSubIdState(id);
    setSelectedSubscriptionId(id);
  };

  const handleAddSub = () => {
    const result = addSubscription(newSubUrl);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    refreshSubscriptions();
    if (result.item) {
      handleSelectSub(result.item.id);
      setNewSubUrl("");
      toast.success("已添加订阅链接");
    }
  };

  const handleRemoveSub = (id: string) => {
    if (!removeSubscription(id)) return;
    refreshSubscriptions();
    setSubProbes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.success("已删除订阅链接");
  };

  const refreshApiBackends = () => setApiBackends(getAllApiBackends());

  const handleSelectApi = (id: string) => {
    setSelectedApiIdState(id);
    setSelectedApiId(id);
  };

  const handleAddApi = () => {
    const result = addCustomApiBackend(newApiUrl);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    refreshApiBackends();
    if (result.backend) {
      handleSelectApi(result.backend.id);
      setNewApiUrl("");
      toast.success("已添加转换后端");
    }
  };

  const handleAddIncludeKeyword = () => {
    const keyword = newIncludeKeyword.trim();
    if (!keyword) return;
    if (includeKeywords.includes(keyword)) {
      toast.error("该关键词已存在");
      return;
    }
    setIncludeKeywords((prev) => [...prev, keyword]);
    setNewIncludeKeyword("");
  };

  const handleRemoveIncludeKeyword = (keyword: string) => {
    setIncludeKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  const handleRemoveApi = (id: string) => {
    if (!removeCustomApiBackend(id)) return;
    const next = getAllApiBackends();
    refreshApiBackends();
    if (!next.some((b) => b.id === selectedApiId)) {
      const fallback = next[0];
      if (fallback) handleSelectApi(fallback.id);
    }
    toast.success("已删除自定义后端");
  };

  const refreshConfigSources = () => setConfigSources(getAllConfigSources());

  const handleSelectConfig = (id: string) => {
    setConfigSourceIdState(id);
    setSelectedConfigSourceId(id);
  };

  const githubSource =
    configSources.find((s) => s.id === EDITABLE_CONFIG_SOURCE_ID) ?? configSources[3];

  const startEditGithub = () => {
    setEditingGithub(true);
    setEditGithubIniUrl(githubSource.url);
  };

  const cancelEditGithub = () => setEditingGithub(false);

  const handleSaveGithub = () => {
    const result = updateGithubIniUrl(editGithubIniUrl);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    refreshConfigSources();
    setEditingGithub(false);
    setProbes({});
    toast.success("已保存 rules.ini 地址");
  };

  const handleResetGithub = () => {
    if (!resetConfigSource(EDITABLE_CONFIG_SOURCE_ID)) return;
    refreshConfigSources();
    const restored = getAllConfigSources().find((s) => s.id === EDITABLE_CONFIG_SOURCE_ID);
    if (restored) setEditGithubIniUrl(restored.url);
    setProbes((prev) => {
      const next = { ...prev };
      delete next[EDITABLE_CONFIG_SOURCE_ID];
      return next;
    });
    toast.success("已恢复为默认地址");
  };

  const handleGenerate = () => {
    const result = buildSubConverterUrl({
      subUrl: selectedSubUrl,
      configSourceId,
      include: includeKeywords.join("|"),
      noInclude: includeKeywords.length === 0,
      apiBaseUrl: selectedApi?.baseUrl ?? "",
    });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setOutput(result.url);
    toast.success("已生成订阅转换链接");
  };

  const handleProbeSub = async () => {
    if (subscriptions.length === 0) {
      toast.error("请先添加机场订阅链接");
      return;
    }
    setSubProbing(true);
    const loading: Partial<Record<string, SubProbeResult>> = {};
    for (const sub of subscriptions) {
      loading[sub.id] = { status: "loading", ok: false };
    }
    setSubProbes(loading);

    try {
      const results = await probeAllSubscriptions(subscriptions);
      setSubProbes(
        Object.fromEntries(
          Object.entries(results).map(([id, r]) => [id, { ...r, ok: r.status === "ok" }]),
        ),
      );
      const okCount = Object.values(results).filter((r) => r.status === "ok").length;
      if (okCount === 0) {
        toast.error("全部订阅不可用，请检查网络或关闭浏览器代理");
      } else {
        const fastest = Object.entries(results)
          .filter(([, r]) => r.status === "ok" && r.ms != null)
          .sort((a, b) => (a[1].ms ?? 0) - (b[1].ms ?? 0))[0];
        if (fastest) {
          const label = subscriptions.find((s) => s.id === fastest[0])?.name;
          toast.success(
            `${okCount}/${subscriptions.length} 可用，最快：${label}（${fastest[1].ms} ms）`,
          );
        } else {
          toast.success(`${okCount}/${subscriptions.length} 可用`);
        }
      }
    } finally {
      setSubProbing(false);
    }
  };

  const handleProbeConfig = async () => {
    setProbing(true);
    const loading: Partial<Record<string, ConfigProbeResult>> = {};
    for (const source of configSources) {
      loading[source.id] = { status: "loading" };
    }
    setProbes(loading);

    try {
      const results = await probeAllConfigSources(configSources);
      setProbes(results);
      const okCount = Object.values(results).filter((r) => r.status === "ok").length;
      if (okCount === 0) {
        toast.error("全部地址不可用，请检查网络或关闭浏览器代理");
      } else {
        const fastest = Object.entries(results)
          .filter(([, r]) => r.status === "ok" && r.ms != null)
          .sort((a, b) => (a[1].ms ?? 0) - (b[1].ms ?? 0))[0];
        if (fastest) {
          const label = configSources.find((s) => s.id === fastest[0])?.label;
          toast.success(
            `${okCount}/${configSources.length} 可用，最快：${label}（${fastest[1].ms} ms）`,
          );
        } else {
          toast.success(`${okCount}/${configSources.length} 可用`);
        }
      }
    } finally {
      setProbing(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  return (
    <div className="min-h-svh bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-1 text-center">
          <CardTitle className="text-center">Clash 订阅转换</CardTitle>
          <CardDescription className="text-center">
            基于{" "}
            <a
              className="text-primary underline-offset-4 hover:underline"
              href="https://github.com/Aethersailor/SubConverter-Extended"
              target="_blank"
              rel="noreferrer"
            >
              SubConverter-Extended
            </a>
          </CardDescription>
        </div>

        <Card>
          <CardContent>
            <FieldGroup>
              <Field>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel className="mb-0">机场订阅链接</FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5"
                    disabled={subProbing || subscriptions.length === 0}
                    onClick={handleProbeSub}
                  >
                    <ActivityIcon className="size-3.5" />
                    {subProbing ? "检测中…" : "直连测速"}
                  </Button>
                </div>
                <div className="grid gap-2">
                  {subscriptions.map((sub) => {
                    const probe = subProbes[sub.id];
                    const probeText = formatSubProbeResult(probe);

                    return (
                      <div
                        key={sub.id}
                        className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 has-checked:border-primary has-checked:bg-primary/5"
                      >
                        <FieldLabel
                          htmlFor={`sub-${sub.id}`}
                          className="mb-0 flex min-w-0 flex-1 cursor-pointer items-center gap-2 font-normal"
                        >
                          <input
                            id={`sub-${sub.id}`}
                            type="radio"
                            name="subscription"
                            className="size-4 shrink-0 accent-primary"
                            checked={selectedSubId === sub.id}
                            onChange={() => handleSelectSub(sub.id)}
                          />
                          <span className="min-w-0 truncate font-mono text-sm">{sub.url}</span>
                        </FieldLabel>
                        {probeText ? (
                          <span
                            className={
                              probe?.status === "ok"
                                ? "shrink-0 font-mono text-emerald-600 dark:text-emerald-400"
                                : probe?.status === "loading"
                                  ? "shrink-0 text-muted-foreground"
                                  : "shrink-0 text-destructive"
                            }
                          >
                            {probeText}
                          </span>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`删除 ${sub.url}`}
                          onClick={() => handleRemoveSub(sub.id)}
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <InputGroup>
                  <InputGroupInput
                    autoComplete="off"
                    value={newSubUrl}
                    onChange={(e) => setNewSubUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
                  />
                  <InputGroupAddon align="inline-end" className="py-0 pr-3 has-[>button]:mr-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-primary disabled:opacity-40"
                      disabled={!newSubUrl.trim()}
                      aria-label="添加"
                      onClick={handleAddSub}
                    >
                      <CheckIcon className="size-3.5" />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel>转换后端</FieldLabel>
                <div className="grid gap-2">
                  {apiBackends.map((api) => (
                    <div
                      key={api.id}
                      className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 has-checked:border-primary has-checked:bg-primary/5"
                    >
                      <FieldLabel
                        htmlFor={`api-${api.id}`}
                        className="mb-0 flex min-w-0 flex-1 cursor-pointer items-center gap-2 font-normal"
                      >
                        <input
                          id={`api-${api.id}`}
                          type="radio"
                          name="apiBackend"
                          className="size-4 shrink-0 accent-primary"
                          checked={selectedApiId === api.id}
                          onChange={() => handleSelectApi(api.id)}
                        />
                        <span className="min-w-0 truncate font-mono text-sm">{api.baseUrl}</span>
                      </FieldLabel>
                      {!isBuiltinApiBackend(api.id) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`删除 ${api.baseUrl}`}
                          onClick={() => handleRemoveApi(api.id)}
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <InputGroup>
                  <InputGroupInput
                    autoComplete="off"
                    value={newApiUrl}
                    onChange={(e) => setNewApiUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddApi()}
                  />
                  <InputGroupAddon align="inline-end" className="py-0 pr-3 has-[>button]:mr-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-primary disabled:opacity-40"
                      disabled={!newApiUrl.trim()}
                      aria-label="添加"
                      onClick={handleAddApi}
                    >
                      <CheckIcon className="size-3.5" />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel className="mb-0">rules.ini 来源</FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5"
                    disabled={probing}
                    onClick={handleProbeConfig}
                  >
                    <ActivityIcon className="size-3.5" />
                    {probing ? "检测中…" : "直连测速"}
                  </Button>
                </div>
                <div className="grid gap-2">
                  {configSources.map((source) => {
                    const isGithub = source.id === EDITABLE_CONFIG_SOURCE_ID;
                    const probe = probes[source.id];
                    const probeText = formatProbeResult(probe);

                    if (isGithub && editingGithub) {
                      return (
                        <div
                          key={source.id}
                          className="flex w-full min-w-0 flex-col gap-2 rounded-lg border border-primary/50 bg-primary/5 p-3"
                        >
                          <Input
                            autoComplete="off"
                            value={editGithubIniUrl}
                            onChange={(e) => setEditGithubIniUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveGithub()}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" className="gap-1.5" onClick={handleSaveGithub}>
                              <CheckIcon className="size-3.5" />
                              保存
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="gap-1.5"
                              onClick={cancelEditGithub}
                            >
                              <XIcon className="size-3.5" />
                              取消
                            </Button>
                            {isGithubIniOverridden() ? (
                              <Button
                                type="button"
                                variant="ghost"
                                className="gap-1.5"
                                onClick={handleResetGithub}
                              >
                                <RotateCcwIcon className="size-3.5" />
                                恢复默认
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={source.id}
                        className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 has-checked:border-primary has-checked:bg-primary/5"
                      >
                        <FieldLabel
                          htmlFor={`config-${source.id}`}
                          className="mb-0 flex min-w-0 flex-1 cursor-pointer items-center gap-2 font-normal"
                        >
                          <input
                            id={`config-${source.id}`}
                            type="radio"
                            name="config"
                            className="size-4 shrink-0 accent-primary"
                            checked={configSourceId === source.id}
                            onChange={() => handleSelectConfig(source.id)}
                          />
                          <span className="min-w-0 truncate font-mono text-sm">{source.url}</span>
                        </FieldLabel>
                        {probeText ? (
                          <span
                            className={
                              probe?.status === "ok"
                                ? "shrink-0 font-mono text-emerald-600 dark:text-emerald-400"
                                : probe?.status === "loading"
                                  ? "shrink-0 text-muted-foreground"
                                  : "shrink-0 text-destructive"
                            }
                          >
                            {probeText}
                          </span>
                        ) : null}
                        {isGithub ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground"
                            aria-label="编辑 GitHub rules.ini 地址"
                            onClick={startEditGithub}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Field>

              <Field>
                <FieldLabel>节点筛选</FieldLabel>
                <div className="grid gap-2">
                  {includeKeywords.map((keyword) => (
                    <div
                      key={keyword}
                      className="flex h-8 items-center gap-2 rounded-lg border border-border px-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">{keyword}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`删除 ${keyword}`}
                        onClick={() => handleRemoveIncludeKeyword(keyword)}
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <InputGroup>
                  <InputGroupInput
                    autoComplete="off"
                    value={newIncludeKeyword}
                    onChange={(e) => setNewIncludeKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddIncludeKeyword()}
                  />
                  <InputGroupAddon align="inline-end" className="py-0 pr-3 has-[>button]:mr-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-primary disabled:opacity-40"
                      disabled={!newIncludeKeyword.trim()}
                      aria-label="添加关键词"
                      onClick={handleAddIncludeKeyword}
                    >
                      <CheckIcon className="size-3.5" />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t">
            <Button type="button" className="gap-2" onClick={handleGenerate}>
              <LinkIcon className="size-4" />
              生成链接
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!output}
              onClick={handleCopy}
            >
              <CopyIcon className="size-4" />
              复制链接
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>转换结果</CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <Label htmlFor="output" className="sr-only">
                输出链接
              </Label>
              <Textarea id="output" readOnly value={output} className="min-h-8 resize-none" />
            </Field>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
