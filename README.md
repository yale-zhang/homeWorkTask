<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gffzkcmvsDXT4ML1eSrPHxBqmmbVkZLX

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

 
## Requirements analysis   

  需求旨在构建一个智能作业管理系统，核心流程包括：作业采集（从QQ群）→ 存储记录 → AI批改与知识点分析 → 个性化学习计划生成 → 周度学习报告。以下是需求分解：  
**作业监控与采集：**
1.实时监控学校QQ群中的作业消息（文字或图片），自动解析作业内容（如学科、截止时间、要求）。  
2.支持图片类作业的OCR文字识别，确保非文本作业可处理。  
**作业存储与管理：**
1.保存作业原始数据（如布置时间、来源群号）、学生提交记录，并关联学生账号。  
**AI批改与知识点分析：**
1.学生通过扫描作业（图片/文档）提交，系统需支持：  
2.自动批改：对客观题（如选择题）打分，对主观题进行关键点评分。  
3.知识点缺陷分析：基于错题识别薄弱知识点（如“二次函数求解错误率高的”）。  
4.学习计划生成：根据缺陷推荐针对性学习资源（如练习题目、视频讲解）。  
**报告生成：**  
1.每周聚合数据，生成可视化报告（如作业完成率、知识点掌握趋势、建议调整学习计划）。  


## Technology Architecture 

  这个智能作业管理系统（IntelliTask AI）采用了现代前端开发中最流行且高效的技术栈，旨在通过 AI 驱动核心流程。以下是详细的技术架构解析：
1. 核心框架与语言 (Core)
React 19: 采用最新的 React 版本，利用其声明式 UI 开发模式和高效的组件化架构。
TypeScript: 全程使用 TypeScript 进行开发，通过强类型定义（如 types.ts 中的接口）确保代码的健壮性，特别是在处理复杂的 AI 返回数据结构时。
React Router DOM (v7): 负责应用的路由管理，实现了多页面的单页应用（SPA）体验，包括仪表盘、收件箱、扫描仪等。
2. AI 智能引擎 (AI/Intelligence)
Google Gemini API (@google/genai): 应用的核心大脑。
Gemini 3 Flash: 用于作业内容的快速提取（如从群聊文本中识别科目、截止日期）。
Gemini 3 Pro: 用于复杂的学术任务，如OCR 手写体识别、主观题批改、知识点缺陷分析以及个性化学习计划生成。
JSON Schema 控制: 利用 Gemini 的结构化输出功能，确保 AI 返回的数据可以直接被前端解析为 GradingResult 等对象。
3. 数据可视化 (Data Visualization)
Recharts: 一个基于 React 的强大图表库。
LineChart (折线图): 用于展示学生成绩与完成率的周趋势。
RadarChart (雷达图/蛛网图): 形象地展示学生的知识点掌握程度（五维图），帮助直观发现薄弱环节。
4. UI/UX 表现层 (Styling & Icons)
Tailwind CSS: 采用原子类 CSS 框架，确保了界面的响应式设计和高度一致的视觉风格（采用了类似 Notion/Linear 的极简学术风）。
Lucide React: 提供了现代化的矢量图标库，增强了界面的直观性。
Framer Motion / Tailwind Animate: 应用中包含了 animate-in 等动画类，提供了平滑的页面切换和加载反馈。
5. 硬件集成 (Platform Features)
Media Devices API: 通过浏览器原生的媒体权限请求，支持调用摄像头进行作业拍摄和实时扫描。
FileReader API: 用于处理本地上传的作业图片，将其转化为 Base64 编码供 Gemini 视觉模型进行识别。
6. 构建与分发 (Build & Delivery)
ES Modules (ESM): 应用采用了基于 esm.sh 的现代加载方案，无需重型的构建步骤，直接利用浏览器的原生模块化能力。
Environment Variables: 通过 process.env.API_KEY 安全地注入 API 密钥，确保后端服务的连通性。
总结
该系统是一个典型的 AI-Native Web App。它不仅是一个美观的 CRUD（增删改查）应用，更深度集成了多模态 AI 能力（视觉 + 语言），将传统的作业管理流程自动化和智能化。
