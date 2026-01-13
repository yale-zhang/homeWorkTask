
# IntelliTask AI - 智能作业管理系统

IntelliTask AI 是一款基于 Google Gemini AI 驱动的现代化智能教育辅助平台。

## 1. 需求分析 (Requirement Analysis)

本项目核心解决以下三个教育痛点：

*   **作业采集碎片化**：从繁杂的聊天记录中手动筛选作业内容耗时耗力。
*   **反馈滞后**：学生无法在完成作业后立即获得纠错和逻辑分析。
*   **盲目学习**：缺乏对薄弱知识点的精准定位，导致低效重复练习。

### 核心功能流程：
1.  **智能采集 (Inbox)**：利用 Gemini Flash 提取群聊文本或图片中的作业细节。
2.  **AI 视觉批改 (Scanner)**：使用 Gemini Pro 进行手写体识别、逻辑评分与深度反馈。
3.  **自适应计划 (Learning Hub)**：基于批改结果自动生成个性化提升任务。
4.  **学情追踪 (Reports)**：可视化能力图谱与薄弱点分布。

## 2. 技术架构 (Technical Architecture)

*   **前端框架**: React 19 + TypeScript + Tailwind CSS。
*   **AI 引擎**: Google Gemini API (@google/genai)。
    *   **Gemini 3 Flash**: 负责快速 OCR 提取与任务分类。
    *   **Gemini 3 Pro**: 负责深度的多模态视觉批改与学习计划生成。
*   **国际化**: 自定义多语言 Context (支持中英切换)。
*   **持久化**: 客户端多账号隔离存储 (LocalStorage)。

---

## 3. 快速开始 (Quick Start)

#### 环境配置
由于安全原因，敏感的 API 密钥不直接包含在代码中。请按照以下步骤配置：

1.  在项目根目录新建一个文件，命名为 `.env`。
2.  打开 `.env.example` 文件，将其中的内容复制到 `.env` 中。
3.  填入你的真实密钥：
    *   **API_KEY**: 你的 Google Gemini API Key。
    *   **SUPABASE_URL**: 你的 Supabase 项目 URL。
    *   **SUPABASE_KEY**: 你的 Supabase Anon Key。

#### 本地运行
```bash
npm install
npm run dev
```

### 2. 核心功能
*   **作业采集**：从群聊消息或图片中提取作业任务。
*   **AI 批改**：使用 Gemini Vision API 识别手写内容并进行逻辑批改。
*   **学情报告**：可视化展示知识点掌握情况和周度进度趋势。
*   **学习中心**：基于批改结果自动生成个性化的强化训练计划。

### 3. Supabase 数据库结构
请在 Supabase SQL Editor 中执行以下脚本以初始化：

```sql
-- 用户资料
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  avatar TEXT,
  grade TEXT
);

-- 作业任务
CREATE TABLE homework_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_profiles(id),
  subject TEXT,
  category TEXT,
  content TEXT,
  deadline TEXT,
  status TEXT,
  timestamp BIGINT,
  submission_image TEXT,
  result JSONB
);

-- 学习计划
CREATE TABLE learning_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_profiles(id),
  focus_area TEXT,
  tasks JSONB,
  created_at BIGINT
);
```

## 4. 功能更新记录 (Feature Updates)

### [V1.1] 截止日期与手动管理
*   引入标准日期选择器，支持作业截止时间追踪。
*   新增手动录入表单，兼容非群聊来源的任务。

### [V1.2] 多模态 AI 批改引擎
*   集成 Gemini 视觉能力，支持上传作业照片进行 OCR 全文提取。
*   提供手写体转录预览功能。

### [V1.3] 作业分类与交互式诊断
*   支持“重要考试”、“小测验”及“日常练习”分类标签。
*   诊断报告新增交互点击，可下钻查看具体知识点的掌握建议。

### [V1.4] 学习追踪与智能过滤
*   仪表盘新增多维过滤器（按科目、类别、日期筛选）。
*   Learning Hub 引入动态进度环监控计划完成度。

### [V1.5] 全球化支持 (Internationalization)
*   全界面支持中英文一键切换。
*   AI 服务层自适应 Prompt 语言，确保反馈语言与 UI 一致。

### [V1.6] 图像持久化与自动批改 (Image Persistence)
*   采集阶段上传的图片自动关联至批改流程。
*   支持“图片就绪”状态，进入批改中心可立即自动触发 AI 分析。

### [V1.7] 批改历史记录管理 (Grading History)
*   新增“历史记录”标签页，保存所有过往的批改报告。
*   支持无损秒开旧记录，无需重复调用 AI 接口。

### [V1.8] 微信授权登录与账号中心 (WeChat Auth & Multi-Accounts)
*   **模拟授权**: 引入符合微信规范的登录全屏界面，支持多账号模拟登录。
*   **账号切换**: 侧边栏头像支持唤起账号中心，实现秒级身份切换。
*   **数据隔离**: 所有作业与进度均与 `userId` 绑定，确保多用户数据互不干扰。

---

## 5. 免责声明
本系统生成的批改意见和学习建议由 AI 生成，仅供辅助学习使用，请结合实际教学情况参考。
