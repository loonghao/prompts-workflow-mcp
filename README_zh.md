# Prompts Workflow MCP

[![npm version](https://badge.fury.io/js/prompts-workflow-mcp.svg)](https://badge.fury.io/js/prompts-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[English](README.md) | [中文](README_zh.md)

一个智能的 MCP 服务器，使 AI 助手能够通过自然语言命令执行预定义的工作流，支持全局和项目特定的自动化模板。

## 🚀 特性

- **自然语言工作流执行**: 通过简单命令如 `/workflow create-pr` 执行工作流
- **分层配置**: 支持全局和项目特定的工作流
- **Markdown 定义**: 使用直观的 Markdown 格式定义工作流
- **项目类型检测**: 自动检测并根据项目类型建议工作流
- **MCP 协议集成**: 通过 MCP 与 AI 助手无缝集成
- **CLI 支持**: 用于工作流管理的命令行界面
- **模板系统**: 常见开发场景的内置模板

## 📦 安装

### 全局安装

```bash
npm install -g prompts-workflow-mcp
```

### 使用 npx 直接运行

```bash
npx -y prompts-workflow-mcp init
```

## 🛠️ 快速开始

### 1. 初始化项目配置

```bash
npx prompts-workflow-mcp init
```

### 2. 列出可用工作流

```bash
npx prompts-workflow-mcp list
```

### 3. 创建自定义工作流

```bash
npx prompts-workflow-mcp create my-workflow
```

### 4. 启动 MCP 服务器

```bash
npx prompts-workflow-mcp server
```

## 🔧 MCP 配置

将以下配置添加到您的 MCP 客户端配置中：

```json
{
  "mcpServers": {
    "prompts-workflow": {
      "command": "npx",
      "args": ["prompts-workflow-mcp"],
      "env": {
        "PROMPTS_WORKFLOW_GLOBAL_PATH": "~/.prompts-workflow"
      }
    }
  }
}
```

## 📝 工作流定义格式

工作流使用 YAML 格式定义：

```yaml
name: "create-pr"
description: "创建带有自动检查的拉取请求"
version: "1.0.0"
scope: "project"
tags: ["git", "testing", "ci"]

steps:
  - name: "运行代码检查"
    type: "command"
    command: "npm run lint"
    continue_on_error: false
    
  - name: "运行测试"
    type: "command"
    command: "npm test"
    continue_on_error: false
    
  - name: "创建 PR"
    type: "action"
    action: "github.create_pr"
    parameters:
      title: "{{ pr_title }}"
      description: "{{ pr_description }}"
```

## 🏗️ 项目结构

```
prompts-workflow-mcp/
├── src/                    # 源代码
│   ├── server/            # MCP 服务器实现
│   ├── workflow/          # 工作流管理
│   ├── config/            # 配置系统
│   ├── utils/             # 工具函数
│   └── cli/               # CLI 接口
├── templates/             # 内置工作流模板
├── schemas/               # JSON 模式
└── docs/                  # 文档
```

## 🔧 配置

### 全局配置 (~/.prompts-workflow/config.yaml)

```yaml
global:
  templates_path: "~/.prompts-workflow/templates"
  default_timeout: 300000
  auto_cleanup: true

integrations:
  github:
    auto_clean_augment_descriptions: true
    default_branch: "main"

security:
  sandbox_mode: true
  max_execution_time: 3600000
  allowed_commands: ["npm", "python", "cargo", "go", "git"]
```

### 项目配置 (.prompts-workflow/config.yaml)

```yaml
project:
  name: "my-project"
  type: "javascript"

workflows:
  create-pr:
    extends: "global:javascript/create-pr"
    parameters:
      pr_template: ".github/pull_request_template.md"
```

## 🛡️ 安全性

- **沙盒执行**: 命令在受控环境中运行
- **命令白名单**: 可配置的允许/阻止命令
- **超时保护**: 防止失控进程
- **环境隔离**: 受控的环境变量访问

## 🧪 测试

```bash
# 运行测试
npm test

# 运行覆盖率测试
npm run test:coverage

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

## 🤝 贡献

我们欢迎贡献！请查看我们的[贡献指南](./CONTRIBUTING.md)了解详情。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 🔗 链接

- [文档](./docs/)
- [API 参考](./docs/api.md)
- [工作流指南](./docs/workflows.md)
- [示例](./examples/)

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) 提供协议规范
- [TypeScript](https://www.typescriptlang.org/) 开发语言
- 所有帮助改进此项目的贡献者
