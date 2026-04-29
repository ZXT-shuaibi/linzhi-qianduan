# 邻知前端

邻知前端基于 `React + TypeScript + Vite` 开发，当前版本已经从早期演示型 mock 页面切换到真实接口驱动的实现，包含登录注册、首页动态、搜索、发布、个人主页、关注关系、社区发现与市集等主要页面。

## 技术栈

- React 18
- TypeScript 5
- Vite 4
- React Router 6

## 目录说明

```text
src/
  components/    通用组件与页面级组件
  context/       全局状态与认证上下文
  features/      按业务聚合的功能模块
  pages/         路由页面
  services/      接口请求与数据映射
  theme/         主题变量
  types/         类型定义
```

## 本地开发

```bash
npm install
npm run dev
```

默认开发端口为 `5174`。

## 构建

```bash
npm run build
```

## 接口配置

可以通过环境变量 `VITE_API_BASE_URL` 指定后端地址。

- 未配置时，前端会直接请求相对路径。
- 本地开发环境下，`/api` 请求会由 Vite 代理到 `http://localhost:8080`。

## 当前整理说明

- 已移除未接入主路由的旧 mock 原型文件，避免真实接口与演示接口双轨并存。
- 已将服务层中重复的帖子映射和用户映射逻辑提取为共享模块，减少维护冗余。
- 项目注释统一使用简体中文。
- 已补充 `.gitignore`，默认忽略 `node_modules`、`dist` 与 `.npm-cache`。
