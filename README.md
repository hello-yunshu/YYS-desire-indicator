# 性欲指示器 / Desire Indicator

一个本地化的自我状态记录工具，通过可自定义的滑块记录多维状态，并生成简短结论。

## 功能

- **自定义滑块** — 添加、编辑、删除滑块，每个滑块可设定范围和区间标签
- **结论生成** — 未配置 AI 时生成简单文本结论；配置 AI 后生成辛辣毒舌评语
- **AI 评语** — 支持 OpenAI 兼容 API（DeepSeek / Qwen / GPT-4o / Claude 等），API Key 仅存储在本地浏览器
- **主题切换** — 浅色 / 深色 / 跟随系统，自动记忆偏好
- **数据管理** — 导出 / 导入 JSON 配置，一键重置
- **纯前端** — 无后端依赖，数据存储在 localStorage，打开 HTML 即可使用

## 使用方式

直接在浏览器中打开 `index.html` 即可，无需安装或构建。

```bash
# 或用任意静态服务器
npx serve .
# python3 -m http.server
```

## 项目结构

```
index.html   — 页面结构与视图
style.css    — 样式（CSS 变量 + 玻璃拟态 + 动态背景）
app.js       — 逻辑（状态管理 / 滑块渲染 / LLM 调用 / 数据导入导出）
```

## AI 配置

进入 **设置 → AI 评语**，填写：

| 字段 | 说明 |
|------|------|
| API 地址 | OpenAI 兼容的 chat completions 端点，如 `https://api.openai.com/v1/chat/completions` |
| API Key | 你的密钥，仅存储在浏览器 localStorage |
| 模型 | 如 `gpt-4o-mini`、`deepseek-chat` |

配置后点击「生成结论」，AI 将根据各滑块数据撰写 50 字以内的毒舌简评。

## 默认滑块

| 滑块 | 范围 | 区间 |
|------|------|------|
| 性欲 | 0–100 | 低 / 中等 / 高 |
| 性取向 | 0–100 | 偏女性 / 双向·不确定 / 偏男性 |
| 亲密需求 | 0–100 | 低 / 中等 / 高 |

可在设置中自由增删修改。

## 技术栈

- 原生 HTML / CSS / JavaScript，零依赖
- CSS 自定义属性 + Glassmorphism
- localStorage 持久化
- XMLHttpRequest 调用 LLM API

## 许可证

[GPL-3.0](LICENSE)
