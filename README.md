# IntelliTask AI - 智能作业管理系统

IntelliTask AI 是一个闭环的智能教育辅助系统，通过 AI 技术实现从作业采集、批改到自适应学习与报告生成的全流程自动化。

## 1. 业务逻辑分析

系统构建了一个“采集-批改-反馈-提升”的教育闭环：

```mermaid
mindmap
  root((IntelliTask AI))
    账号与同步
      多账号切换 (WeChat/GitHub)
      云端持久化 (Supabase)
      本地缓存 (LocalStorage)
      国际化 (ZH/EN)
    作业采集 (Inbox)
      IM群聊提取 (AI 语义分析)
      手动录入 (AI 辅助生成)
      任务状态流转 (Pending -> Submitted -> Graded)
    AI 批改扫描 (Scanner)
      OCR 文字识别
      逻辑评估与打分
      强弱项分析
      知识点掌握度建模
    自适应学习 (Learning Hub)
      深度学情剖析 (S-Tier 专家视角)
      按作业切换计划 (1:1 关联)
      阶梯式任务 (基础/进阶/挑战)
    数据可视化 (Reports)
      趋势分析 (得分与完成率)
      能力图谱 (雷达图)
      漏洞预警 (核心知识漏洞)
```

## 2. 数据结构 (E-R 图)

系统核心采用以“用户”为中心，通过 `source_task_id` 强关联“学习计划”的关系模型：

```mermaid
erDiagram
    USER-PROFILE ||--o{ HOMEWORK-TASK : "owns"
    USER-PROFILE ||--o{ LEARNING-PLAN : "owns"
    USER-PROFILE ||--|| APP-SETTINGS : "configures"
    HOMEWORK-TASK ||--o| LEARNING-PLAN : "triggers"
    
    USER-PROFILE {
        string id PK "WeChat/GitHub ID"
        string nickname
        string avatar
        string grade
    }

    HOMEWORK-TASK {
        string id PK
        string user_id FK
        string title
        string subject "Math/English/..."
        string category "Quiz/Homework/..."
        string status "pending/graded"
        jsonb result "GradingResult: score, strengths, weaknesses"
        long timestamp
    }

    LEARNING-PLAN {
        string id PK
        string user_id FK
        string source_task_id FK "关联的作业ID"
        string focus_area
        text deep_analysis "AI 生成的长文本分析"
        jsonb tasks "LearningTask[]: video, reading, exercise"
        long created_at
    }

    APP-SETTINGS {
        string id PK "User ID"
        string aiProvider "gemini/deepseek"
        string geminiApiKey
        string supabaseUrl
        string supabaseKey
    }
```

## 3. 故障排查 (数据不写入？)

如果你的数据没有出现在 Supabase 表中，请依次检查：

1.  **环境变量**：确保 `.env` 中的 `SUPABASE_URL` 和 `SUPABASE_KEY` 正确无误。
2.  **关闭 RLS** (开发阶段建议)：
    在 Supabase SQL Editor 执行以下命令，否则数据库会拦截所有未经认证的写入：
    ```sql
    ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE homework_tasks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE learning_plans DISABLE ROW LEVEL SECURITY;
    ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
    ```
3.  **检查控制台**：打开浏览器开发者工具 (F12) -> Console。代码会详细打印 Supabase 返回的报错信息。

## 4. Supabase 数据库结构初始化

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
  source_task_id TEXT, -- 关联的具体作业 ID
  focus_area TEXT,
  tasks JSONB,
  deep_analysis TEXT, -- 存储深度分析文本
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
```