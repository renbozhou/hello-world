# Project Alpha — 启动指南

## 前置条件

- Python 3.11+
- Node.js 18+
- PostgreSQL（本地运行）

## 后端启动

```bash
# 1. 创建数据库
psql -U postgres -c "CREATE DATABASE project_alpha;"

# 2. 安装依赖
cd backend
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填写正确的 DATABASE_URL

# 4. 启动（自动建表）
uvicorn app.main:app --reload --port 8000
```

API 文档：http://localhost:8000/docs

## 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173
