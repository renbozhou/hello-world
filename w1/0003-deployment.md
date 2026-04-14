# 0003 - Project Alpha 部署方案（Docker）

本文档说明如何将当前仓库中的 **Project Alpha（`w1/`）** 部署到 Docker 环境：包含 **Postgres**、**FastAPI 后端**、**Vite 构建的前端静态资源**。适用于单机或小型服务器场景。

---

## 1. 部署目标与组件

| 组件 | 说明 | 默认对外端口（示例） |
|------|------|----------------------|
| **db** | PostgreSQL，持久化数据卷 | `5432`（生产可仅内网暴露） |
| **api** | FastAPI + Uvicorn | `8000` |
| **web** | Nginx 托管前端 `dist`，并可反向代理 `/api` | `80` 或 `15173` |

当前代码要点（部署时需对齐）：

- 后端通过环境变量 `DATABASE_URL`、`CORS_ORIGINS` 配置（见 `w1/backend/app/core/config.py`）。
- 前端 API 基址当前写死在 `w1/frontend/src/api.ts` 的 `API_BASE`；**生产环境建议改为构建期环境变量**（例如 `import.meta.env.VITE_API_BASE`），见下文「前端与 API 地址」。
- **PostgreSQL 18+** 官方镜像要求数据卷挂载在 **`/var/lib/postgresql`**，不要挂到 `/var/lib/postgresql/data`（与 `w1/docker-compose.yml` 注释一致）。若从 16 升级，需按官方流程迁移数据。

---

## 2. 部署形态选型

### 2.1 形态 A：仅数据库容器化（开发/轻量）

- 使用现有 `w1/docker-compose.yml` 只启动 `db`。
- 后端、前端在宿主机运行（`uv run uvicorn`、`npm run dev`）。
- `DATABASE_URL` 使用 `localhost:5432`（或 Docker Desktop 的 host 网关）。

**优点**：调试快。  
**缺点**：前后端不在同一编排网络，生产一致性差。

### 2.2 形态 B：全栈 Docker Compose（推荐生产基线）

- 一个 `docker-compose.yml`（或 `compose.prod.yml`）定义 `db`、`api`、`web` 三个服务。
- 内部网络：`api` 连接 `db` 时使用服务名 `db` 作为主机名。
- `web` 通过 Nginx 把 `/api` 代理到 `http://api:8000`，浏览器只访问一个域名/端口，避免 CORS 复杂配置。

**优点**：环境一致、易迁移、易扩缩。  
**缺点**：需要维护 Dockerfile 与镜像构建。

下文以 **形态 B** 为主展开。

---

## 3. 目录与文件规划（建议）

在 `w1/` 下增加部署专用文件（与业务代码分离，便于 CI 构建）：

```
w1/
  deploy/
    Dockerfile.api          # 后端镜像
    Dockerfile.web        # 前端构建 + nginx
    nginx.conf              # 静态资源 + /api 反代
  docker-compose.prod.yml   # 生产编排（可选，与开发 compose 分离）
```

> 说明：本文档给出 **可直接粘贴** 的示例内容；你可将这些文件按路径创建后纳入版本库。

---

## 4. 后端镜像（Dockerfile.api 示例）

设计要点：

- 使用 **uv** 安装依赖并运行（与当前 `w1/backend/pyproject.toml` 一致）。
- 工作目录 `/app`，启动命令 `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`。
- **不要**把含密钥的 `.env` 打进镜像；通过 Compose `environment` 或 `env_file` 注入。

```dockerfile
# w1/deploy/Dockerfile.api
FROM python:3.12-slim-bookworm

RUN pip install --no-cache-dir uv

WORKDIR /app

# 仅复制依赖描述，利用层缓存
COPY backend/pyproject.toml backend/uv.lock* ./

RUN uv sync --frozen --no-dev

COPY backend/app ./app

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

构建上下文应为 **`w1/`** 目录（因 `COPY backend/...`）：

```bash
cd w1
docker build -f deploy/Dockerfile.api -t project-alpha-api:latest .
```

---

## 5. 前端镜像（Dockerfile.web + Nginx 示例）

设计要点：

- **多阶段构建**：Node 阶段 `npm ci && npm run build`，Nginx 阶段拷贝 `dist`。
- 生产环境 API：由 Nginx 将 `/api` 转发到后端容器，前端请求使用**相对路径** `/api`（需改 `api.ts`，见第 7 节）。

**nginx.conf 示例**（`w1/deploy/nginx.conf`）：

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://api:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Dockerfile.web 示例**：

```dockerfile
# w1/deploy/Dockerfile.web
FROM node:22-alpine AS build
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
# 构建时使用相对 API 基址（需配合 Vite 环境变量，见第 7 节）
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
```

构建：

```bash
cd w1
docker build -f deploy/Dockerfile.web -t project-alpha-web:latest .
```

---

## 6. 生产编排 docker-compose.prod.yml 示例

要点：

- **db**：镜像固定小版本（如 `postgres:18`），卷绑定到宿主机目录或命名卷；密码用环境变量，勿写死在仓库。
- **api**：`DATABASE_URL` 指向 `postgresql+psycopg://postgres:密码@db:5432/project_alpha`；`CORS_ORIGINS` 设为实际访问前端的来源（若走同源反代，可为 `http://localhost` 或你的域名）。
- **web**：依赖 `api`；对外映射 `15173:80` 或 `80:80`。
- **depends_on**：`api` 依赖 `db`；可加 `healthcheck` 避免 api 过早连库失败。

```yaml
# w1/docker-compose.prod.yml（示例，请按环境修改密码与卷路径）
services:
  db:
    image: postgres:18
    container_name: project-alpha-db-prod
    environment:
      POSTGRES_DB: project_alpha
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d project_alpha"]
      interval: 5s
      timeout: 5s
      retries: 10

  api:
    build:
      context: .
      dockerfile: deploy/Dockerfile.api
    image: project-alpha-api:latest
    container_name: project-alpha-api-prod
    environment:
      DATABASE_URL: postgresql+psycopg://postgres:${POSTGRES_PASSWORD}@db:5432/project_alpha
      # 同源部署时可为单一来源；跨域时列出浏览器实际 Origin
      CORS_ORIGINS: '["http://localhost:15173"]'
    depends_on:
      db:
        condition: service_healthy
    expose:
      - "8000"

  web:
    build:
      context: .
      dockerfile: deploy/Dockerfile.web
      args:
        VITE_API_BASE: /api
    image: project-alpha-web:latest
    container_name: project-alpha-web-prod
    ports:
      - "15173:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

启动：

```bash
cd w1
set POSTGRES_PASSWORD=你的强密码
docker compose -f docker-compose.prod.yml up -d --build
```

访问：`http://localhost:15173/`（页面内请求 `/api/...` 由 Nginx 转到 `api`）。

---

## 7. 前端与 API 地址（生产必改）

当前 `w1/frontend/src/api.ts` 使用：

```ts
const API_BASE = "http://localhost:8000/api";
```

在 **Docker + Nginx 同源反代** 下应改为相对路径或环境变量，例如：

```ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
```

并在 `w1/frontend/.env.production` 中设置：

```env
VITE_API_BASE=/api
```

Dockerfile 构建阶段传入 `ARG VITE_API_BASE=/api` 与 `ENV VITE_API_BASE`（见第 5 节），这样打包后的静态资源会指向同源 `/api`，无需浏览器跨域。

若 **前后端分离域名**（不推荐首版），则 `VITE_API_BASE` 设为完整 `https://api.example.com/api`，且后端 `CORS_ORIGINS` 必须包含前端 `https://app.example.com`。

---

## 8. 环境变量与安全清单

| 变量 | 服务 | 说明 |
|------|------|------|
| `POSTGRES_PASSWORD` | db / api | 强密码；Compose 用 `${POSTGRES_PASSWORD}` 注入 |
| `DATABASE_URL` | api | 含用户、密码、主机 `db`、库名 |
| `CORS_ORIGINS` | api | JSON 数组字符串，与浏览器 Origin 一致 |

- 不要把生产 `.env` 提交到 Git；在服务器用 `.env` 或密钥管理注入。
- 生产数据库端口 **可不映射到宿主机**，仅 `api` 通过内部网络访问 `db:5432`。

---

## 9. 数据持久化与备份

- **卷**：使用命名卷（如上 `postgres_data`）或绑定挂载到宿主机目录（注意权限与 PG18 路径规则）。
- **备份**：定期 `pg_dump`（可在宿主机 cron 执行 `docker exec project-alpha-db-prod pg_dump -U postgres project_alpha > backup.sql`）。
- **恢复**：停写 → 恢复数据目录或 `psql` / `pg_restore` → 按官方大版本升级文档操作。

---

## 10. 健康检查与观测

- 后端已有 `GET /api/health`，可在 Compose 中为 `api` 增加：

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://127.0.0.1:8000/api/health"]
  interval: 30s
  timeout: 5s
  retries: 3
```

（若镜像无 `curl`，可改用 `wget` 或安装轻量工具，或使用 `python -c` 请求本机。）

---

## 11. 发布流程（建议）

1. 本地或 CI：`docker compose -f docker-compose.prod.yml build`。
2. 镜像打 tag 推送到镜像仓库（可选）。
3. 服务器：`docker compose pull && docker compose up -d`。
4. 验证：`curl -s http://localhost:15173/api/health`（若 Nginx 已反代 `/api`）。

---

## 12. 与现有 `w1/docker-compose.yml` 的关系

- 当前 `w1/docker-compose.yml` 主要面向 **本地开发数据库**，包含宿主机路径等个人化配置。
- **生产**建议使用独立的 `docker-compose.prod.yml`（或 `compose.override` 模式），避免开发卷路径进入生产服务器。

---

## 13. 故障排查简表

| 现象 | 可能原因 |
|------|----------|
| `api` 启动即数据库连接失败 | `DATABASE_URL` 主机不是 `db`；或 `db` 未 healthy |
| 浏览器 404 on `/api` | Nginx `proxy_pass` 路径与后端 `root_path` 不一致；检查是否带尾部 `/` |
| CORS 错误 | `CORS_ORIGINS` 未包含浏览器访问的 Origin；或应改为同源反代 |
| PG 容器报错关于 `data` 卷 | PG18+ 必须使用 `/var/lib/postgresql` 挂载 |
| 前端空白 | `try_files` 与 SPA 路由；确认 `index.html` 在 `dist` 根目录 |

---

## 14. 后续可增强项

- HTTPS：在 `web` 前加 Traefik / Caddy / 云 LB 终止 TLS。
- 多副本 `api`：需会话外状态、连接池与 DB 容量评估。
- 密钥：Docker secrets 或 Kubernetes Secret。
- 迁移：引入 Alembic，镜像启动前执行 `upgrade head`（Job 或 entrypoint）。

---

**文档版本**：与仓库 `w1` 目录结构及 PG18 卷约定对齐；实施时请根据实际域名、端口与密码替换示例中的占位配置。
