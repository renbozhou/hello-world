# Project Alpha — 实现计划

## Phase 划分

| Phase | 内容 | 目标 |
|-------|------|------|
| **Phase 1** | 后端基础 + 前端基础框架 | 可运行的 CRUD API + 基本 UI |
| Phase 2 | 标签筛选 + 搜索 + 完善 UI | 完整功能闭环 |
| Phase 3 | 优化、测试、部署配置 | 生产就绪 |

---

## Phase 1 详细实现计划

### 目标
- 后端：FastAPI + PostgreSQL，实现 Ticket 和 Tag 的完整 CRUD API
- 前端：Vite + React + TypeScript + Tailwind + shadcn/ui，实现 Ticket 列表、创建、编辑、删除、状态切换

---

### Step 1：项目脚手架

#### 1.1 后端初始化

**目录结构**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── routers/
│       ├── __init__.py
│       ├── tickets.py
│       └── tags.py
├── requirements.txt
├── .env.example
└── .env          (本地，不提交)
```

**requirements.txt**
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
psycopg2-binary==2.9.9
python-dotenv==1.0.1
alembic==1.13.1
pydantic==2.7.1
```

**任务清单**
- [ ] 创建 `backend/` 目录结构
- [ ] 编写 `requirements.txt`
- [ ] 编写 `.env.example`（DATABASE_URL 示例）
- [ ] 编写 `app/database.py`（SQLAlchemy engine + SessionLocal + Base）
- [ ] 编写 `app/models.py`（Ticket、Tag、TicketTag ORM 模型）
- [ ] 编写 `app/schemas.py`（Pydantic 请求/响应 schema）
- [ ] 编写 `app/routers/tickets.py`（Ticket CRUD + 状态切换 + 标签关联）
- [ ] 编写 `app/routers/tags.py`（Tag CRUD）
- [ ] 编写 `app/main.py`（FastAPI app，注册路由，CORS）

#### 1.2 前端初始化

**目录结构**
```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts        # axios 实例
│   │   ├── tickets.ts       # Ticket API 函数 + React Query hooks
│   │   └── tags.ts          # Tag API 函数 + React Query hooks
│   ├── components/
│   │   ├── TicketList.tsx
│   │   ├── TicketCard.tsx
│   │   ├── TicketDialog.tsx
│   │   ├── TagSidebar.tsx
│   │   └── SearchBar.tsx
│   ├── types/
│   │   └── index.ts         # Ticket、Tag TypeScript 类型
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── index.html
```

**package.json 关键依赖**
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@tanstack/react-query": "^5",
    "axios": "^1",
    "lucide-react": "^0.378"
  },
  "devDependencies": {
    "typescript": "^5",
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

**shadcn/ui 组件（Phase 1 使用）**
- Button
- Dialog
- Input
- Textarea
- Badge
- AlertDialog
- Checkbox

**任务清单**
- [ ] 初始化 Vite + React + TypeScript 项目
- [ ] 配置 Tailwind CSS
- [ ] 安装并初始化 shadcn/ui
- [ ] 编写 `src/types/index.ts`
- [ ] 编写 `src/api/client.ts`（axios 实例，baseURL 指向后端）
- [ ] 编写 `src/api/tickets.ts`（API 函数 + useTickets/useCreateTicket/useUpdateTicket/useDeleteTicket/usePatchTicketStatus hooks）
- [ ] 编写 `src/api/tags.ts`（API 函数 + useTags/useCreateTag hooks）
- [ ] 编写 `src/components/TagSidebar.tsx`
- [ ] 编写 `src/components/SearchBar.tsx`
- [ ] 编写 `src/components/TicketCard.tsx`
- [ ] 编写 `src/components/TicketList.tsx`
- [ ] 编写 `src/components/TicketDialog.tsx`
- [ ] 编写 `src/App.tsx`（布局组装）

---

### Step 2：数据库初始化

**方式：直接在 `app/main.py` 启动时调用 `Base.metadata.create_all()`**（Phase 1 简化，不使用 Alembic）

**前置条件**
- 本地已安装 PostgreSQL
- 创建数据库：`CREATE DATABASE project_alpha;`
- `.env` 中配置 `DATABASE_URL=postgresql://user:password@localhost:5432/project_alpha`

---

### Step 3：后端 API 实现细节

#### tickets.py 路由

```
GET    /api/v1/tickets              → 列表（支持 tag_id, search, status 过滤）
POST   /api/v1/tickets              → 创建（含 tag_ids）
GET    /api/v1/tickets/{id}         → 详情
PUT    /api/v1/tickets/{id}         → 更新标题/描述
DELETE /api/v1/tickets/{id}         → 删除
PATCH  /api/v1/tickets/{id}/status  → 切换状态
POST   /api/v1/tickets/{id}/tags/{tag_id}    → 添加标签
DELETE /api/v1/tickets/{id}/tags/{tag_id}    → 移除标签
```

#### tags.py 路由

```
GET    /api/v1/tags       → 所有标签
POST   /api/v1/tags       → 创建标签
DELETE /api/v1/tags/{id}  → 删除标签
```

---

### Step 4：前端功能实现细节

#### 布局（App.tsx）

```
┌─────────────────────────────────────────┐
│  Header: "Ticket Manager"  [搜索框] [+新建] │
├──────────┬──────────────────────────────┤
│ TagSidebar│        TicketList            │
│ (标签列表) │  (卡片网格/列表)              │
└──────────┴──────────────────────────────┘
```

#### TicketCard 操作

- 左侧 Checkbox：切换完成状态（done/open）
- 标题：完成时加删除线样式
- 标签 Badge 列表
- 右侧操作：编辑按钮（打开 Dialog）、删除按钮（AlertDialog 确认）

#### TicketDialog 表单字段

- 标题（Input，必填）
- 描述（Textarea，可选）
- 标签（多选 Popover，可内联创建新标签）

---

### Step 5：开发启动命令

**后端**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 填写数据库连接
uvicorn app.main:app --reload --port 8000
```

**前端**
```bash
cd frontend
npm install
npm run dev  # 默认 localhost:5173
```

---

## Phase 2 计划（预览）

- 标签筛选：点击 TagSidebar 中的标签，过滤 TicketList
- 搜索：SearchBar 防抖查询，后端 `ILIKE` 模糊匹配
- 标签管理页：独立页面，支持创建/删除标签
- 状态筛选：全部 / 进行中 / 已完成 Tab 切换
- 分页或无限滚动

## Phase 3 计划（预览）

- 单元测试（pytest + httpx）
- 前端 E2E 测试（Playwright）
- Docker Compose 一键启动
- 生产环境配置（Nginx 反代、环境变量管理）
