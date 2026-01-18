
# IntelliTask AI - 智能作业管理系统

## 1. 快速检查列表 (数据不写入？)

如果你的数据没有出现在 Supabase 表中，请依次检查：

1.  **重启服务**：修改 `.env` 后，必须执行 `ctrl+c` 并重新运行 `npm run dev`。
2.  **关闭 RLS** (开发阶段建议)：
    在 Supabase SQL Editor 执行以下命令，否则数据库会静默拦截所有写入：
    ```sql
    ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE homework_tasks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE learning_plans DISABLE ROW LEVEL SECURITY;
    ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
    ```
3.  **检查控制台**：打开浏览器开发者工具 (F12) -> Console。现在的代码会详细打印 Supabase 返回的报错信息。

## 2. Supabase 数据库结构初始化

在 Supabase **SQL Editor** 中运行以下脚本：

```sql
-- 1. 用户资料
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  avatar TEXT,
  grade TEXT
);

-- 2. 作业任务
CREATE TABLE IF NOT EXISTS homework_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
  source TEXT,
  subject TEXT,
  category TEXT,
  content TEXT,
  deadline TEXT,
  status TEXT,
  title TEXT,
  timestamp BIGINT,
  submission_image TEXT,
  result JSONB
);

-- 3. 学习计划
CREATE TABLE IF NOT EXISTS learning_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_task_id TEXT, -- 新增：关联的具体作业 ID
  focus_area TEXT,
  tasks JSONB,
  deep_analysis TEXT, -- 新增：存储深度分析文本
  source_task_title TEXT,
  source_task_subject TEXT,
  created_at BIGINT
);

-- 4. 应用设置 (用于持久化 AI 服务商, API 密钥等)
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  updated_at BIGINT
);

-- 重要：开发阶段关闭安全策略以允许 API 写入
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE homework_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
```
