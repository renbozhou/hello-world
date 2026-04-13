# Project Alpha（w1）

## 1. 启动数据库

```bash
cd w1
docker compose up -d
```

数据库目录见 `docker-compose.yml` 里的 `volumes`（示例为宿主机路径）。**PostgreSQL 18+ 官方镜像**要求把数据挂载在 **`/var/lib/postgresql`**（父目录），由镜像在子目录中初始化集群；不要再挂到 `/var/lib/postgresql/data`。

若你曾用 **16 及更早** 镜像且把数据挂在 `.../data`，目录里已是旧版数据文件，不能直接换 18+ 镜像继续用：请 **pg_dump 备份 → 清空该宿主机目录（或换新目录）→ 启动 18+ → pg_restore**，或暂时把 `image` 固定为 **`postgres:16`** 并恢复为挂载 `:/var/lib/postgresql/data`。

## 2. 启动后端

```bash
cd w1/backend
uv venv
uv sync
copy .env.example .env
uv run uvicorn app.main:app --reload
```

若本机尚未安装 `uv`，可先执行：

```bash
pip install uv
```

后端地址：`http://localhost:8000/api`

## 3. 启动前端

```bash
cd w1/frontend
npm install
npm run dev
```

前端地址：`http://localhost:15173`
