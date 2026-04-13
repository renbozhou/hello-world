# 0001 - Project Alpha：实现计划（Implementation Plan）

> 目标：按照 `w1/0001-spec.md` 实现一个“Ticket + 标签”管理工具（Postgres + FastAPI + TS/Vite/Tailwind/shadcn），无用户系统，支持 CRUD、完成切换、标签绑定/解绑、按标签筛选、按标题搜索。

## 0. 交付物与完成标准
- **后端**：
  - Postgres schema + migration（`tickets / tags / ticket_tags`）
  - REST API 满足规格：Ticket CRUD、完成/取消完成、标签绑定/解绑、标签列表、列表筛选与搜索
  - 统一错误格式与状态码
- **前端**：
  - Ticket 列表页：搜索、完成状态过滤、标签筛选、创建/编辑、删除确认
  - 标签选择器：已有标签多选 + 输入创建新标签
  - 错误提示与空状态
- **验收**：满足 `0001-spec.md` 的“11.1 验收用例”

## 1. 项目结构与基础设施（建议）
### 1.1 仓库结构（建议）
- `backend/`
  - `app/`（FastAPI 代码）
  - `alembic/`（迁移）
  - `tests/`
  - `pyproject.toml` 或 `requirements.txt`
- `frontend/`
  - `src/`
  - `index.html`
  - `vite.config.ts`
- `docker-compose.yml`（本地 Postgres）

### 1.2 本地运行方式（最小可用）
- Postgres：docker compose 启动，暴露端口与持久化卷
- 后端：
  - 配置 `DATABASE_URL`、`CORS_ORIGINS`
  - `uvicorn app.main:app --reload`
- 前端：
  - `pnpm install`（或 npm/yarn 统一一种）
  - `pnpm dev`

## 2. 数据库与迁移（Postgres + Alembic）
### 2.1 选型与约定
- UUID 作为主键
- `created_at/updated_at` 使用 `timestamptz`
- `ticket_tags` 复合主键 `(ticket_id, tag_id)` + `ON DELETE CASCADE`

### 2.2 迁移步骤
- 初始化 Alembic（生成版本表）
- 创建表：
  - `tickets`：含 `is_completed`、`completed_at`、`created_at`、`updated_at`
  - `tags`：`name` unique（必要），`color` optional
  - `ticket_tags`：复合主键 + 2 个外键级联
- 增加索引：
  - `tickets(updated_at desc)`
  - `tickets(is_completed)`
  - `ticket_tags(tag_id)`
- （可选）`updated_at` 自动更新：
  - 简化做法：在应用层更新时手动写入
  - 或 DB trigger（本期不强制）

### 2.3 数据校验策略
本期用服务层确保：
- complete：写入 `completed_at=now()`
- uncomplete：清空 `completed_at`
- `untagged=true` 与 `tag_id` 互斥（API 层校验）

## 3. 后端实现（FastAPI）
### 3.1 技术栈建议
- FastAPI + Pydantic v2
- SQLAlchemy 2.0（async）或 SQLModel（async）
- Alembic 迁移
- pytest（+ httpx TestClient/AsyncClient）

### 3.2 分层与模块划分（建议）
- `app/main.py`：FastAPI 创建、CORS、中间件
- `app/db/`：engine/session、依赖注入 `get_db`
- `app/models/`：ORM models（Ticket/Tag/TicketTag）
- `app/schemas/`：Pydantic DTO（TicketDto/TagDto、创建/更新请求）
- `app/repos/`：DB 查询（list/filter/search、绑定/解绑）
- `app/services/`：业务逻辑（完成切换、标签去重/复用、错误语义）
- `app/api/`：路由（`tickets.py`、`tags.py`）
- `app/errors.py`：统一异常与错误响应

### 3.3 API 逐步落地顺序（推荐按联调价值）
#### 阶段 A：健康检查 + 基础列表
- `GET /api/tags`（先返回空列表也可）
- `GET /api/tickets`（先实现无过滤版本）
  - 返回结构：`items/total/limit/offset`

#### 阶段 B：Ticket CRUD
- `POST /api/tickets`
  - 校验：title trim + 长度
  - 可选支持 `tag_ids`（若先不做也可，后续补）
- `PATCH /api/tickets/{id}`
- `GET /api/tickets/{id}`
- `DELETE /api/tickets/{id}`

#### 阶段 C：完成/取消完成
- `POST /api/tickets/{id}/complete`
- `POST /api/tickets/{id}/uncomplete`

#### 阶段 D：标签创建 + 绑定/解绑
- `POST /api/tags`
  - 策略：若 name 冲突返回 409（严格）或直接复用（更顺滑）
  - 若采用“复用”，需要明确返回的是已有 Tag 并保持幂等
- `POST /api/tickets/{id}/tags`
  - 支持 `{tag_id}` 或 `{tag_name}`
  - 幂等：重复绑定不报错
- `DELETE /api/tickets/{id}/tags/{tag_id}`
  - 幂等：不存在也 204

#### 阶段 E：筛选与搜索
- `GET /api/tickets` 增量支持：
  - `q`（ILIKE）
  - `completed`
  - `tag_id`
  - `untagged=true`（与 tag_id 互斥）
  - 排序 `updated_at_desc`

### 3.4 查询实现要点（Repo 层）
- **tag 过滤**：`JOIN ticket_tags` 并按 `tag_id` 过滤（注意 distinct）
- **untagged**：`LEFT JOIN ticket_tags`，`WHERE ticket_tags.ticket_id IS NULL`
- **搜索**：`WHERE tickets.title ILIKE '%q%'`（注意参数化，避免注入）
- **分页**：limit/offset；同时做 `total` 计数（可用子查询或窗口函数）

### 3.5 错误处理与状态码
- 422：请求体/参数校验失败（Pydantic）
- 400：互斥参数（`untagged` 与 `tag_id`）等业务校验
- 404：ticket/tag 不存在
- 409：tag.name 冲突（若采用严格策略）
- 错误响应格式统一为 `{"error": {"code","message","details"}}`

### 3.6 后端测试计划（pytest）
#### 单元测试（service 层）
- 完成/取消完成：`completed_at` 写入/清空
- 标签创建/复用策略（trim、大小写策略按实现定义）
- 绑定幂等：重复绑定不新增记录

#### 集成测试（API）
- Ticket：create/edit/get/list/delete
- 完成切换：complete/uncomplete
- 标签：create/list
- 绑定/解绑：add/remove
- 查询：tag_id、untagged、completed、q 组合

## 4. 前端实现（Vite + React + Tailwind + shadcn）
### 4.1 技术栈建议
- React + TypeScript
- TailwindCSS
- shadcn/ui（Dialog、Input、Button、Badge、DropdownMenu、Tabs）
- TanStack Query（强烈建议，用于缓存、失效、乐观更新）
- 路由：可选（React Router），若不做也可用 query string 自己管理

### 4.2 页面与组件拆分（建议）
#### 页面：`TicketListPage`
- 顶部栏：
  - `SearchInput`（防抖）
  - `CompletedFilterTabs`（all/false/true）
  - `NewTicketButton`
- 侧边/顶部标签栏：
  - `TagFilterList`（all/untagged/tags...）
- 主区：
  - `TicketList`
  - `EmptyState`

#### 组件：`TicketRow`
- 完成勾选（调用 complete/uncomplete）
- 标题（点击打开编辑）
- 标签 badges（可移除）
- 更多操作（Dropdown：编辑、删除）

#### 组件：`TicketEditorDialog`（创建/编辑复用）
- 表单字段：title、description
- `TagMultiSelect`（多选 + 新建）
- 保存按钮（loading/disable）

#### 组件：`TagMultiSelect`
- 初始拉取 tags 列表
- 输入过滤 + 回车创建 tag
- 选中项以 badge 展示，可点击移除

### 4.3 API Client 与数据流（建议）
- `apiClient.ts`：
  - 封装 baseUrl、JSON 解析、错误统一转换
- Query Key 规划：
  - `['tags']`
  - `['tickets', { q, completed, tag, untagged, limit, offset }]`
- Mutation 后的刷新：
  - create/edit/delete/complete：失效 `tickets` 列表 query
  - tag create/bind/unbind：失效 `tags` 与 `tickets`
- （可选）乐观更新：
  - complete/uncomplete、unbind tag 可做乐观体验

### 4.4 交互与边界处理
- 删除 Ticket：二次确认 Dialog
- 输入校验：
  - title trim + 非空
  - 长度超限提示
- 错误提示：
  - toast（shadcn Sonner）或页面内 Alert
- 空状态：
  - 无 ticket：引导创建
  - 无 tag：提示可在选择器里创建

### 4.5 UI 排序与默认行为建议
- 默认列表排序按 `updated_at DESC`
- 默认 completed filter：`all` 或 `false`（建议默认只看未完成，更贴近待办）
- 标签栏排序：
  - 字母序或 usage_count desc（后端支持 usage_count 时再做）

## 5. 联调与验收（按用例逐条打通）
### 5.1 联调顺序（建议）
- 先联调 `GET /tags` + `GET /tickets`（渲染空状态）
- 再联调创建 Ticket（能创建、列表刷新）
- 再做编辑/删除
- 再做完成切换
- 再做标签：创建 + 绑定/解绑
- 最后做筛选与搜索（组合条件）

### 5.2 验收清单（对应规格 11.1）
- 创建 Ticket：保存后列表出现，刷新仍在
- 编辑 Ticket：列表更新
- 完成/取消完成：状态正确、刷新保持
- 删除 Ticket：确认后删除，刷新不存在
- 标签添加/移除：结果正确
- 按标签筛选：只显示含该 Tag 的 Ticket
- 未打标签筛选：只显示无标签 Ticket
- 搜索：按 title ILIKE，忽略大小写

## 6. 里程碑与时间盒（示例）
> 你可以按自己的节奏调整；这里给一个“可落地”的拆分。

- **M1（后端可用）**：DB + migration + Ticket CRUD + list（含分页）+ tags list
- **M2（核心闭环）**：complete/uncomplete + 标签创建 + 绑定/解绑
- **M3（筛选与搜索）**：q / completed / tag_id / untagged + 前端联调完成
- **M4（质量）**：后端测试覆盖关键用例 + 前端错误/空状态完善

## 7. 风险与对策
- **ILIKE 性能**：数据量大时慢；本期接受，后续加 `pg_trgm` 索引优化
- **标签唯一策略（复用 vs 409）**：优先复用以提升体验；但需要后端确保一致与幂等
- **offset 分页在大数据量下退化**：本期接受，后续可改 cursor pagination
