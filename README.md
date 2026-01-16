
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
敏感的 API 密钥不应直接暴露在公开仓库或前端 bundle 中。此项目在前端需要一些公开型变量（以 `VITE_` 前缀），但对于任何需要保密或付费权限的密钥，应放在后端中继（proxy）或 serverless 函数中。

步骤：

1. 在项目根目录新建一个文件，命名为 `.env`。
2. 打开 `.env.example`，将示例内容复制到 `.env` 并替换为你的值。
3. 在本地开发中，使用 `VITE_` 前缀的变量将暴露给客户端。例如：

```text
VITE_API_KEY=your_google_gemini_api_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_supabase_anon_or_public_key
```

安全建议：

- 如需在 AI 或数据库操作中使用高权限密钥（写入/管理权限或付费调用），请不要直接在前端使用。建议实现一个轻量后端中继：前端调用受限的后端接口，后端持有真实密钥并负责与第三方服务交互。
- 在生产环境中，可将真实密钥放入服务器环境变量或使用云提供的密钥管理服务（例如 AWS Secrets Manager、GCP Secret Manager）。

开发与运行：
```bash
npm install
npm run dev
```

通过 Docker 构建并设置构建时 ARG（注意：build-time ARG 也会被打包到镜像中）：
```bash
API_KEY=your_key docker-compose build
API_KEY=your_key docker-compose up
```

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


## 5. 免责声明
本系统生成的批改意见和学习建议由 AI 生成，仅供辅助学习使用，请结合实际教学情况参考。

### [DevOps] CI/CD 与 远程部署（2026-01-14）
*  添加 `.env.example`，统一使用 `VITE_` 前缀并在 README 中补充环境与安全说明。
*  修改 `vite.config.ts`，使用 `envPrefix: 'VITE_'`；更新 `services/apiService.ts` 与 `services/geminiService.ts`，优先从运行时注入的 `window.__RUNTIME__` 读取配置，回退到 `import.meta.env`（开发环境）。
*  引入运行时注入方案：新增 `docker-entrypoint.sh`，容器启动时生成 `env-config.js`（由 `index.html` 加载），避免在镜像中直接 bake 敏感密钥。
*  添加多阶段 `Dockerfile`（Node 构建 -> nginx 运行），并在 `docker-compose.yml` 中示例化运行时环境变量与 Docker secrets 的使用建议。
*  新增 CI 工作流：`.github/workflows/ci-deploy.yml`，示例将镜像构建并推送至 GHCR（ghcr.io），并通过 SSH 在远程主机拉取并部署镜像。
*  添加远端部署与自愈脚本：`scripts/bootstrap_server.sh`、`scripts/update_and_restart.sh`、`scripts/deploy_app.sh`、`scripts/remote_bootstrap_example.sh`，并提供 `systemd` 单元 `scripts/systemd/intellitask-updater.service` 与 `intellitask-updater.timer`，用于定期自动拉取并重启容器。
*  更新 README 的 CI/CD 与部署章节，包含 GitHub Secrets 列表、远端主机准备、GHCR 登录以及手动/自动部署示例。


## CI/CD 与 部署（示例）

下面提供一个最小部署参考，配合仓库中的 GitHub Actions workflow（`.github/workflows/ci-deploy.yml`）。

- GitHub 仓库 Secrets（在`Settings → Secrets and variables → Actions`添加新 secret）：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_KEY`
  - `VITE_API_KEY` (注意：若为敏感/付费密钥，建议不要放在前端，改为后端代理)
  - `SSH_PRIVATE_KEY`（用于 deploy 到远程主机）
  - `DEPLOY_HOST`（例如 `1.2.3.4`）
  - `DEPLOY_USER`（例如 `ubuntu`）

- 远程主机准备（以 Ubuntu 为例）:

```bash
# 更新系统并安装 Docker 引擎与 compose 插件
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" |
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
# 允许当前用户使用 docker（可选）
sudo usermod -aG docker $USER
```

- 远程主机部署示例（Actions workflow 已示范）：
  - CI 会将镜像推送到 `ghcr.io/<owner>/intellitask-ai:latest`。
  - 在远程主机上，CI 通过 SSH 写入 `~/app/.env` 并执行 `docker-compose pull` 与 `docker-compose up -d`。

- 手动在远程主机部署（参考）:

```bash
# 在部署主机上
mkdir -p ~/app && cd ~/app
# 把仓库的 docker-compose.yml 放到 ~/app/docker-compose.yml（或通过 git pull 获取）
cat > .env <<EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_supabase_key
VITE_API_KEY=your_api_key
EOF

docker compose pull
docker compose up -d --remove-orphans
```

- 安全提示：
  - 尽量不要将付费/高权限密钥暴露给前端（`VITE_API_KEY` 仅用于示例）。如果需要调用 Google Gemini 或其它敏感服务，请创建后端代理接口，由后端持有密钥并对外提供受控 API。

## 远端使用脚本与 GHCR 登录（详尽示例）

本仓库提供若干脚本用于远程主机的自动部署与定期更新，下面示例展示如何在远端配置并安全地拉取私有镜像（GHCR）。

1) 在远端准备并运行 bootstrap：

```bash
# 克隆或把仓库复制到远程主机
git clone https://github.com/<owner>/homeWorkTask.git ~/homeWorkTask
cd ~/homeWorkTask
# 以 root 执行引导（示例用户 ubuntu），会安装 docker 并启用 timer
sudo ./scripts/bootstrap_server.sh ubuntu
```

2) 把 `docker-compose.yml` 放到 `~/app`（或把仓库内容 clone 到 `~/app`）：

```bash
mkdir -p ~/app
cp docker-compose.yml ~/app/
# 确保 ~/app/docker-compose.yml 指向正确的镜像标签（默认在 CI 推送到 ghcr.io/<owner>/intellitask-ai:latest）
```

3) 将运行时变量与 GHCR 凭据写入 `~/app/.env`（推荐权限 600）：

```bash
cat > ~/app/.env <<EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_supabase_key
VITE_API_KEY=your_api_key
# 可选：为私有 GHCR 拉取提供凭据（只在需要私有镜像时添加）
GHCR_USER=ghcr_username
GHCR_TOKEN=ghcr_personal_access_token
EOF
chmod 600 ~/app/.env
```

注意：为 GHCR 创建的 PAT（Personal Access Token）尽量只赋予 `read:packages` 权限。

4) 手动执行一次部署：

```bash
sudo /usr/local/bin/intellitask-deploy.sh
```

5) 手动登录 GHCR（替代把 GHCR 凭据写入 `.env`）：

```bash
# 在远端执行（或把 GHCR_TOKEN 导入为 CI secrets 后由 CI 写入），避免把 token 放入日志
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

6) 验证 systemd timer 与服务：

```bash
sudo systemctl status intellitask-updater.timer
sudo systemctl status intellitask-updater.service
sudo journalctl -u intellitask-updater.service -f
```

7) 手动触发更新与重启（用于调试）：

```bash
sudo /usr/local/bin/intellitask-update.sh
```

安全建议与最佳实践：
- 将 GHCR 的拉取凭据视为敏感秘密，尽量使用系统级秘密存储（例如 `/etc/` 下受限文件），并把权限设置为 600。不要把凭据写入公开日志或版本库。
- 若可能，使用云提供的部署服务（例如 ECS、GKE、App Runner 等）并通过平台的 Secret Manager 注入密钥，而不是把 secrets 写入文件系统。
- 强烈建议把对 `@google/genai` 的调用放到后端服务中（后端持有 API 密钥并对外提供受控接口），前端不应直接包含高权限密钥。

