# ccalm-rules

OpenClash 订阅转换：本仓库提供 [rules.ini](./rules.ini)（分流策略）与 **订阅转换** Web 页面（本地生成转换链接，订阅地址不上传服务器）。

- 转换 API 示例：[SubConverter-Extended](https://github.com/Aethersailor/SubConverter-Extended) 公共实例 `https://api.asailor.org/sub`
- 本地开发、构建、代码检查：见 [web/README.md](./web/README.md)

## 1Panel 部署

与 [ccalm-system](https://github.com/ccalm952/ccalm-system) 相同：**Vite 构建静态资源 → 放入 1Panel 网站目录 → OpenResty 配置 SPA 回退**。

### 目录结构

```text
ccalm-rules/
  web/        # 前端（构建产物在 web/dist/）
  rules.ini   # OpenClash 远程 config
```

### 部署步骤

```bash
cd /opt/ccalm-rules
git clone https://github.com/ccalm952/ccalm-rules.git .
pnpm install
pnpm build
cp -r web/dist/* /opt/1panel/www/sites/<你的域名>/index/
```

在 1Panel 对应站点的 OpenResty 配置中增加：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

浏览器访问你的域名，使用页面生成转换链接后，将结果填入 OpenClash **订阅地址**（客户端类型选 Clash；订阅转换可关闭，转换已在链接中完成）。

### 更新

```bash
cd /opt/ccalm-rules
git pull
pnpm install
pnpm build
cp -r web/dist/* /opt/1panel/www/sites/<你的域名>/index/
```

## 相关链接

- [rules.ini](./rules.ini)
- [SubConverter-Extended](https://github.com/Aethersailor/SubConverter-Extended)
- [Custom_OpenClash_Rules](https://github.com/Aethersailor/Custom_OpenClash_Rules)
