# Project Alpha — 需求与设计文档

## 1. 项目概述

构建一个轻量级的 Ticket 管理工具，支持通过标签对 Ticket 进行分类和筛选。系统无需用户认证，面向单用户或小团队内部使用。

**技术栈**
- 后端：Python / FastAPI + PostgreSQL（通过 SQLAlchemy ORM）
- 前端：TypeScript / Vite / Tailwind CSS / shadcn/ui

---

## 2. 功能需求

### 2.1 Ticket 管理

| 功能 | 描述 |
|------|------|
| 创建 Ticket | 填写标题、描述，可选择已有标签或新建标签 |
| 编辑 Ticket | 修改标题、描述 |
| 删除 Ticket | 永久删除，需二次确认 |
| 完成 Ticket | 将状态标记为 `done` |
| 取消完成 Ticket | 将状态从 `done` 恢复为 `open` |

### 2.2 标签管理

| 功能 | 描述 |
|------|------|
| 创建标签 | 在创建/编辑 Ticket 时内联创建，或在标签管理页单独创建 |
| 为 Ticket 添加标签 | 在 Ticket 详情/编辑界面多选标签 |
| 从 Ticket 移除标签 | 在 Ticket 详情/编辑界面取消选中标签 |

### 2.3 筛选与搜索

| 功能 | 描述 |
|------|------|
| 按标签筛选 | 点击标签后只显示含该标签的 Ticket |
| 按标题搜索 | 输入关键词实时过滤 Ticket 列表（前端过滤或后端模糊查询） |

---

## 3. 数据模型

### 3.1 tickets 表

```sql
CREATE TABLE tickets (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'open',  -- 'open' | 'done'
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 3.2 tags 表

```sql
CREATE TABLE tags (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE
);
```

### 3.3 ticket_tags 关联表

```sql
CREATE TABLE ticket_tags (
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    tag_id    INTEGER NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, tag_id)
);
```

---

## 4. API 设计

Base URL: `/api/v1`

### 4.1 Tickets

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/tickets` | 获取 Ticket 列表，支持 `?tag_id=&search=&status=` 查询参数 |
| POST | `/tickets` | 创建 Ticket |
| GET | `/tickets/{id}` | 获取单个 Ticket 详情 |
| PUT | `/tickets/{id}` | 更新 Ticket（标题、描述） |
| DELETE | `/tickets/{id}` | 删除 Ticket |
| PATCH | `/tickets/{id}/status` | 切换完成状态 |
| POST | `/tickets/{id}/tags/{tag_id}` | 为 Ticket 添加标签 |
| DELETE | `/tickets/{id}/tags/{tag_id}` | 从 Ticket 移除标签 |

### 4.2 Tags

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/tags` | 获取所有标签 |
| POST | `/tags` | 创建标签 |
| DELETE | `/tags/{id}` | 删除标签（同时解除所有关联） |

### 4.3 请求/响应示例

**创建 Ticket**
```json
// POST /api/v1/tickets
// Request
{
  "title": "修复登录页面样式",
  "description": "移动端按钮溢出容器",
  "tag_ids": [1, 3]
}

// Response 201
{
  "id": 5,
  "title": "修复登录页面样式",
  "description": "移动端按钮溢出容器",
  "status": "open",
  "tags": [
    { "id": 1, "name": "bug" },
    { "id": 3, "name": "mobile" }
  ],
  "created_at": "2026-04-13T10:00:00Z",
  "updated_at": "2026-04-13T10:00:00Z"
}
```

**切换状态**
```json
// PATCH /api/v1/tickets/5/status
// Request
{ "status": "done" }

// Response 200
{ "id": 5, "status": "done", ... }
```

---

## 5. 前端设计

### 5.1 页面结构

```
App
├── Header（标题 + 搜索框）
├── Sidebar（标签列表，点击筛选）
└── Main
    ├── TicketList（Ticket 卡片列表）
    └── TicketDialog（创建/编辑弹窗）
```

### 5.2 主要组件

| 组件 | 职责 |
|------|------|
| `TicketList` | 展示 Ticket 卡片，支持状态切换、删除操作 |
| `TicketCard` | 单张卡片，显示标题、状态、标签、操作按钮 |
| `TicketDialog` | 创建/编辑表单弹窗（shadcn Dialog） |
| `TagSidebar` | 左侧标签导航，点击过滤列表 |
| `SearchBar` | 顶部搜索输入框 |
| `TagBadge` | 标签徽章，可点击 |

### 5.3 状态管理

使用 React Query（TanStack Query）管理服务端状态，无需额外全局状态库。

- `useTickets(filters)` — 获取 Ticket 列表
- `useCreateTicket()` — 创建 Ticket mutation
- `useUpdateTicket()` — 更新 Ticket mutation
- `useDeleteTicket()` — 删除 Ticket mutation
- `usePatchTicketStatus()` — 切换状态 mutation
- `useTags()` — 获取标签列表
- `useCreateTag()` — 创建标签 mutation

### 5.4 UI 交互细节

- 搜索框防抖 300ms 后触发查询
- 删除 Ticket 弹出 shadcn AlertDialog 二次确认
- 标签多选使用 shadcn Popover + Checkbox 组合
- Ticket 状态切换使用行内 Checkbox 或按钮，即时反馈
- 空状态展示友好提示文案

---

## 6. 项目目录结构

```
w1claude/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── database.py      # DB 连接与 Session
│   │   ├── models.py        # SQLAlchemy ORM 模型
│   │   ├── schemas.py       # Pydantic 请求/响应模型
│   │   └── routers/
│   │       ├── tickets.py
│   │       └── tags.py
│   ├── alembic/             # 数据库迁移
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/             # axios 封装 + React Query hooks
    │   ├── components/      # UI 组件
    │   ├── types/           # TypeScript 类型定义
    │   └── App.tsx
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.ts
```

---

## 7. 非功能需求

- 响应时间：列表查询 < 500ms（本地开发环境）
- 数据库索引：`tickets.status`、`ticket_tags.tag_id` 建立索引
- CORS：后端允许前端开发服务器跨域（`localhost:5173`）
- 错误处理：API 返回标准 HTTP 状态码，前端 toast 提示错误信息
