# Instructions

## project alpha  需求文档

构建一个一个简单的，使用标签分类和管理ticket的工具。它基于Postgres 数据库，使用 Fast API 作为后端，使用Typescript/Vite/Tailwind/Shadcn 作为前端。无需用户系统，当前用户可以:
- 创建/编辑/删除/完成/取消完成 ticket
- 添加/删除 ticket 的标签
- 按照不同的标签查看ticket 列表
- 按 title 搜索ticket

按这个想法生成详细的需求和设计文档，放在 ./w1/0001-spec.md 文件中，输出为中文。

## implementation plan

按照 ./w1/0001-spec.md 中的需求和设计文档，生成一个详细的实现计划，放在 ./w1/0001-implementation-plan.md 文件中，输出为中文。 


## phased implementation
按照 ./w1/0001-implementation-plan.md 完整实现这个项目的 phase 1 代码 , 代码生成到 ./w1/ 文件夹下面。

## 完成项目UI 优化 
按照 apple websit 的设计风格，think ultra hard, 优化UI UX 。

## precommit 
use pre-commit to init the config and setup precommit for python and type script for this project ,also setup github action , precommit should be under root diretor.

## 完成构建项目部署
完成项目的部署,项目如何部署到  docker 中，给出详细的部署方案，输出到 .w1/0003-deployment.md 文档中