# 订阅转换（ccalm-rules-web）

浏览器标题与页面标题均为 **订阅转换**。技术栈：Vite + React + **shadcn/ui**（与 [ccalm-system](https://github.com/ccalm952/ccalm-system) 相同：`base-nova` + Tailwind v4）。

## 本地开发

```bash
cd /path/to/ccalm-rules
pnpm install
pnpm dev
```

浏览器：[http://localhost:5173](http://localhost:5173)

## 构建

```bash
pnpm build
# 产物：web/dist/
```

## 代码检查

在仓库根目录执行（oxlint / oxfmt / eslint 安装在根 `package.json`）：

```bash
pnpm check       # oxfmt --check + lint
pnpm fmt         # 格式化 web/
pnpm lint:ox     # Oxlint
pnpm lint:eslint # ESLint（React Hooks、TypeScript 等）
```

## 添加 shadcn 组件

与 ccalm-web 相同，在 `web` 目录执行：

```bash
cd web
pnpm dlx shadcn@latest add <组件名>
```

配置见 [components.json](./components.json)。

## 1Panel 部署

见根目录 [README.md](../README.md)。
