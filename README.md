# IntelliTask AI - 智能作业管理系统

IntelliTask AI 是一款基于 Google Gemini AI 驱动的现代化智能教育辅助平台。它旨在通过 AI 技术打通作业从“布置”到“批改”再到“个性化提升”的全链路流程，帮助学生更高效地管理学业并精准修补知识漏洞。

## 1. 需求分析 (Requirement Analysis)

本项目核心解决以下三个教育痛点：

*   **作业采集碎片化**：家长和学生常需要从繁杂的 QQ/微信 群聊信息中手动筛选作业内容。
*   **反馈滞后**：传统人工批改周期长，学生无法在完成作业后的第一时间获得纠错反馈。
*   **盲目刷题**：学生往往不清楚自己的具体薄弱知识点，缺乏针对性的练习。

### 核心功能流程：
1.  **智能采集 (Inbox)**：实时监控并一键提取社交群聊中的作业任务（科目、内容、截止日期）。
2.  **AI 视觉批改 (Scanner)**：通过手机拍摄上传作业，AI 利用多模态视觉能力进行 OCR 识别、手写体逻辑分析及打分。
3.  **缺陷诊断 (Diagnosis)**：自动生成知识点掌握程度报告，精准定位“哪里不会”。
4.  **闭环学习 (Learning Hub)**：基于诊断结果，AI 自动生成包含视频、练习 and 阅读材料的个性化提升计划。
5.  **成长看板 (Reports)**：通过可视化图表追踪长期学习趋势。

## 2. 技术架构解析 (Technical Architecture)

系统采用全栈式 AI-Native 架构，核心技术选型如下：

### 核心框架与语言
*   **React 19**: 利用组件化架构实现流畅的单页应用 (SPA) 体验。
*   **TypeScript**: 强类型系统确保了 AI 返回的复杂 JSON 数据在前端处理时的安全性和一致性。

### AI 智能引擎
*   **Google Gemini API (@google/genai)**:
    *   **Gemini 3 Flash**: 用于轻量级的任务提取，平衡响应速度与处理能力。
    *   **Gemini 3 Pro**: 负责核心的**视觉批改**与**深度逻辑推理**。它能识别复杂的数学公式、分析语境，并根据教学逻辑给出反馈。
    *   **Structured Output**: 严格利用 JSON Schema 模式，确保 AI 的输出能直接被前端 Recharts 等组件读取并可视化。

### UI/UX 表现层
*   **Tailwind CSS**: 采用响应式设计，提供极简、专业的学术风界面。
*   **Lucide React**: 现代化的矢量图标，提升交互直观性。
*   **Recharts**: 实现动态的**学习趋势折线图**和**知识点掌握程度雷达图**。

### 存储与权限
*   **LocalStorage 持久化**: 通过 React 的 `useEffect` 钩子实时同步状态，确保数据在页面刷新后依然存在。
*   **Browser Media API**: 支持摄像头调用，模拟真实的作业拍摄场景。

---

## 3. 功能更新 (Feature Updates)

### [V1.1] 截止日期与手动管理
*   **截止日期集成**: 在作业录入环节引入了标准的日期选择器，确保所有任务均有明确的时间属性。
*   **多维度看板展示**: 仪表盘 (Dashboard) 现已支持同步显示任务的 Due Date，并根据紧急程度进行视觉差异化处理。
*   **手动录入模块**: 除了 AI 提取，用户现在可以通过“Add Manual”表单快速添加自定义作业任务。

### [V1.2] 多模态 AI 批改引擎
*   **OCR 文字提取**: 在扫描页面新增“Quick OCR”功能，利用 Gemini 3 Flash 的视觉能力实时提取作业原稿文字。
*   **Gemini Pro 深度批改**: 批改逻辑升级为 Gemini 3 Pro 驱动，能够生成包含评分、详细反馈、手写原稿转录、及多维度知识点掌握度评分的综合报告。
*   **学情闭环**: 批改结果会自动触发 Learning Hub 的个性化方案更新，实现“测-练-提”的一体化。

---

## 4. 本地构建与部署 (Local Build & Deployment)

本项目支持通过 Docker 或传统的 Node.js 环境进行本地部署。

### 方案 A：使用 Docker Compose (推荐)
这是最简单的部署方式，只需一个命令即可完成环境搭建。

1.  **准备配置文件**：
    在项目根目录创建 `.env` 文件，填入你的 Gemini API Key：
    ```bash
    API_KEY=你的_GEMINI_API_KEY
    ```
2.  **启动服务**：
    ```bash
    docker-compose up --build
    ```
3.  **访问应用**：
    打开浏览器访问 `http://localhost:8080`。

### 方案 B：传统 Node.js 部署
适用于需要进行代码修改和实时调试的开发场景。

1.  **安装依赖**：
    ```bash
    npm install
    ```
2.  **设置环境变量**：
    *   **Windows (PowerShell)**: `$env:API_KEY="你的_KEY"; npm run dev`
    *   **macOS/Linux**: `export API_KEY="你的_KEY"; npm run dev`
3.  **预览构建**：
    ```bash
    npm run build
    npm run preview
    ```

---

## 5. 开发说明
本项目采用现代 ESM 加载方案，配合 Vite 进行极速构建。

**API 配置**: 系统依赖 `process.env.API_KEY` 进行 Gemini 服务调用。在生产构建中，该 Key 会在构建阶段被注入到前端包中。