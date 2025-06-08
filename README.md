# Prompts Workflow MCP

[![npm version](https://badge.fury.io/js/prompts-workflow-mcp.svg)](https://badge.fury.io/js/prompts-workflow-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[中文文档](./README_zh.md) | English

An intelligent MCP (Model Context Protocol) server that enables AI assistants to execute predefined workflows through natural language commands, supporting both global and project-specific automation templates.

## 🚀 Features

- **Natural Language Workflow Execution**: Execute workflows with simple commands like `/workflow create-pr`
- **Hierarchical Configuration**: Support for both global and project-specific workflows
- **Markdown-based Definitions**: Define workflows using intuitive Markdown format
- **Project Type Detection**: Automatically detect and suggest workflows based on project type
- **MCP Protocol Integration**: Seamless integration with AI assistants through MCP
- **CLI Support**: Command-line interface for workflow management
- **Template System**: Built-in templates for common development scenarios

## 📦 Installation

### Global Installation

```bash
npm install -g prompts-workflow-mcp
```

### Direct Usage with npx

```bash
npx -y prompts-workflow-mcp init
```

## 🛠️ Quick Start

### 1. Initialize Project Configuration

```bash
npx prompts-workflow-mcp init
```

### 2. List Available Workflows

```bash
npx prompts-workflow-mcp list
```

### 3. Create a Custom Workflow

```bash
npx prompts-workflow-mcp create my-workflow
```

### 4. Start MCP Server

```bash
npx prompts-workflow-mcp serve
```

## 🔧 MCP Configuration

Add to your MCP client configuration:

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

## 📝 Workflow Definition Format

Workflows are defined using Markdown format:

```markdown
# Workflow: create-pr

**Description**: Create a pull request with automated checks
**Version**: 1.0.0
**Scope**: project
**Tags**: git, testing, ci

## Steps

### 1. Run linter
- **Type**: command
- **Command**: `npm run lint`
- **Continue on error**: false

### 2. Run tests
- **Type**: command
- **Command**: `npm test`
- **Continue on error**: false

### 3. Create PR
- **Type**: action
- **Action**: github.create_pr
- **Parameters**:
  - title: "{{ pr_title }}"
  - description: "{{ pr_description }}"
```

## 🏗️ Project Structure

```
prompts-workflow-mcp/
├── src/                    # Source code
│   ├── server/            # MCP server implementation
│   ├── workflow/          # Workflow management
│   ├── config/            # Configuration system
│   ├── utils/             # Utility functions
│   └── cli/               # CLI interface
├── templates/             # Built-in workflow templates
├── schemas/               # JSON schemas
└── docs/                  # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Documentation](./docs/)
- [API Reference](./docs/api.md)
- [Workflow Guide](./docs/workflows.md)
- [Examples](./examples/)

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the protocol specification
- [TypeScript](https://www.typescriptlang.org/) for the development language
- All contributors who help improve this project
