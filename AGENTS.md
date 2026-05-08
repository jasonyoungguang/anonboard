# AnonBoard 项目 Agent 规则

## 自动 Git 提交规则

每次代码修改完成并确认无误后，自动执行以下步骤：

1. `git add -A` 暂存所有变更
2. `git commit -m "<简明的变更描述>"` 提交
3. `git push origin main` 推送到 GitHub

提交信息格式要求：
- 使用中文简要描述本次变更内容
- 以 `🤖 Generated with [Qoder](https://qoder.com)` 结尾

## 项目结构

- `family-tree/` — 家族谱项目（Spring Boot 3 后端 + Vue 3 前端）
- `llm-tutorial/` — LLM 教学演示页面（React + TypeScript）
- 根目录 — 项目入口门户页

## 技术栈

- 后端：Java 21, Spring Boot 3.2.5, MyBatis-Plus 3.5.7, MySQL
- 前端（family-tree）：Vue 3 + TypeScript + Vite + Pinia + D3.js v7
- 前端（llm-tutorial）：React + TypeScript + Tailwind CSS

## 启动命令

- 后端：`cd family-tree/backend && mvn spring-boot:run`（端口 8080）
- 前端开发：`cd family-tree/frontend && npx vite`
- 前端构建后由后端 serve
