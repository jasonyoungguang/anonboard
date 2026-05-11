# AnonBoard 项目 Agent 规则

## 自动 Git 提交规则

每次代码修改完成并确认无误后，自动执行以下步骤：

1. `git add -A` 暂存所有变更
2. `git commit -m "<简明的变更描述>"` 提交
3. `git push origin main` 推送到 GitHub

提交信息格式要求：
- 使用中文简要描述本次变更内容
- 以 `🤖 Generated with [Qoder](https://qoder.com)` 结尾

## 需求管理规则（强制遵守）

项目需求记录文件为 `REQUIREMENTS.md`，所有需求变更必须遵循以下流程：

### 规则 1：每次新需求必须先记录再实现
- 收到用户的新需求后，**先不写代码**
- 先在 `REQUIREMENTS.md` 中查找是否有相同或相似的需求
- 如果没有，在对应模块末尾添加新需求行（分配新的需求 ID）
- 在"需求变更记录"表中添加一行记录（日期、变更类型、需求 ID、变更描述）
- 然后才进入代码实现阶段

### 规则 2：每次需求变更必须比对已有记录
- 用户提出的新需求或变更，必须与 `REQUIREMENTS.md` 中**所有已有需求逐条比对**
- 检查项：
  - 是否与已有需求**功能重复**（同一个功能被再次提出）
  - 是否与已有需求**存在冲突**（新需求导致已有需求无法满足）
  - 是否**影响已有需求的实现方式**（需要联动修改已有功能）
- 如果发现以上情况之一，**必须暂停**，向用户说明冲突/重复内容，等待用户确认后再推进

### 规则 3：每次代码实现后更新需求状态
- 需求完成实现后，将对应行的"状态"列更新为 `✅ 已完成`
- 在"备注"列填写实现概述（涉及的文件或关键设计点）
- 变更记录表中的"日期"填写当天日期

### 规则 4：不允许随意修改 REQUIREMENTS.md 结构
- 不删除已有需求行
- 不修改已有需求 ID
- 变更需求只需更新"状态"和"备注"列
- 新增需求统一追加到对应模块末尾

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
