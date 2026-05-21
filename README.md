# ccalm-rules

Mihomo / Clash 分流覆写，仓库内仅维护 [ccalm-rules.yaml](./ccalm-rules.yaml)。

## 用法

| 场景 | 操作 |
|------|------|
| Clash Party | 设置 → 覆写 → YAML，粘贴全文或填远程地址。见 [覆写文档](https://clashparty.org/docs/guide/override/yaml) |
| Sub-Store | 文件管理 → Mihomo 配置 → 脚本操作，粘贴全文（YAML patch） |
| 远程引用 | 使用下方 GitHub raw 链接（`main` 分支） |

```text
https://raw.githubusercontent.com/ccalm952/ccalm-rules/main/ccalm-rules.yaml
```

## 节点命名

地区 url-test 组按节点名前缀匹配，Sub-Store 组合订阅里重命名即可：

`香港 `、`美国 `、`韩国 `、`日本 `（前缀 + 空格 + 名称）

## 规则库

GeoSite / GeoIP：[meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat)（`geosite.dat`、`geoip.dat`）。

## 编辑约定

排版见 [.editorconfig](./.editorconfig)。覆写文件只写需覆盖的字段（如 `mode`、`rules`、`proxy-groups`），勿加仅供文档的顶层键。

- 规则一行一条：`TYPE,值,策略`；`no-resolve` 写在行尾
- 策略组名与 `rules` 引用完全一致
- `filter` 正则用单引号，如 `'^香港\s'`
- 注释用 `#` 做分组标题即可
