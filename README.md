# Prompts Workflow MCP

[![npm version](https://badge.fury.io/js/prompts-workflow-mcp.svg)](https://badge.fury.io/js/prompts-workflow-mcp)
[![CI](https://github.com/loonghao/prompts-workflow-mcp/workflows/CI/badge.svg)](https://github.com/loonghao/prompts-workflow-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[中文文档](./README_zh.md) | English

An intelligent MCP (Model Context Protocol) server that enables AI assistants to execute predefined workflows through natural language commands, supporting both global and project-specific automation templates.

## 🚀 Features

- **Natural Language Workflow Execution**: Execute workflows with simple commands like `/workflow create-pr`
- **Intelligent Project Detection**: Automatically detects project type (JavaScript, Python, Rust, Go) and suggests relevant workflows
- **Hierarchical Configuration**: Support for both global and project-specific workflows with inheritance
- **Template System**: Built-in language-specific templates that can be customized and overridden
- **Markdown-based Definitions**: Define workflows using intuitive Markdown format
- **MCP Protocol Integration**: Seamless integration with AI assistants through MCP
- **CLI Support**: Command-line interface for workflow management
- **Flexible Override System**: Project-level workflows can override global templates

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

## 🎯 Design Philosophy

### Intelligent Workflow Management

Prompts Workflow MCP follows a **smart defaults with flexible overrides** approach:

#### 1. **Automatic Project Detection**
- Detects project type based on files (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`)
- Analyzes file patterns (`*.js`, `*.py`, `*.rs`, `*.go`) for confidence scoring
- Suggests relevant workflows automatically

#### 2. **Hierarchical Workflow System**
```
Global Templates (Built-in)
├── templates/javascript/create-pr.yaml
├── templates/python/create-pr.yaml
├── templates/rust/create-pr.yaml
└── templates/go/create-pr.yaml

Project-Level Overrides (Customizable)
├── .prompts-workflow/workflows/create-pr.yaml  # Overrides global
├── .prompts-workflow/workflows/custom-deploy.yaml  # Project-specific
└── .prompts-workflow/config.yaml  # Project configuration
```

#### 3. **Smart Workflow Resolution**
When you run `/workflow create-pr`:
1. **Project Detection**: Identifies project as Python (finds `pyproject.toml`)
2. **Template Selection**: Loads `templates/python/create-pr.yaml`
3. **Override Check**: Looks for `.prompts-workflow/workflows/create-pr.yaml`
4. **Execution**: Uses project override if exists, otherwise uses global template

#### 4. **Customization Levels**

**Level 1: Use Built-in Templates**
```bash
# Just works out of the box
/workflow create-pr
```

**Level 2: Override Parameters**
```yaml
# .prompts-workflow/config.yaml
workflows:
  create-pr:
    parameters:
      pr_title: "feat: automated changes"
      run_tests: false
```

**Level 3: Custom Workflow**
```yaml
# .prompts-workflow/workflows/create-pr.yaml
name: "create-pr"
description: "Custom PR workflow for our team"
extends: "templates/python/create-pr"  # Inherit from global
steps:
  - name: "Custom linting"
    type: "command"
    command: "our-custom-linter"
  # ... rest inherited from global template
```

**Level 4: Completely Custom**
```yaml
# .prompts-workflow/workflows/deploy-staging.yaml
name: "deploy-staging"
description: "Deploy to staging environment"
scope: "project"
steps:
  - name: "Build Docker image"
    type: "command"
    command: "docker build -t myapp:staging ."
  # ... custom deployment steps
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

## 💡 Usage Examples

### Example 1: First Time Usage (JavaScript Project)

```bash
# In a JavaScript project directory
$ ls
package.json  src/  tests/  README.md

# List available workflows (auto-detects JavaScript)
$ npx prompts-workflow-mcp list
Available workflows for JavaScript project:
  ✓ create-pr - Create a pull request with automated checks
  ✓ run-tests - Run test suite with coverage
  ✓ deploy - Deploy to production

# Execute the create-pr workflow
$ npx prompts-workflow-mcp execute create-pr
🔍 Detected: JavaScript project
📋 Using template: templates/javascript/create-pr.yaml
🚀 Executing workflow...
  ✓ Install dependencies (npm install)
  ✓ Run linter (npm run lint)
  ✓ Run tests (npm test)
  ✓ Build project (npm run build)
  ✓ Create PR (github.create_pr)
✅ Workflow completed successfully!
```

### Example 2: Customizing a Workflow

```bash
# Create project-specific override
$ npx prompts-workflow-mcp create create-pr
📝 Created: .prompts-workflow/workflows/create-pr.yaml

# Edit the workflow to add custom steps
$ cat .prompts-workflow/workflows/create-pr.yaml
```

```yaml
name: "create-pr"
description: "Custom PR workflow with security scan"
extends: "templates/javascript/create-pr"
version: "1.1.0"
scope: "project"

# Override parameters
parameters:
  - name: "pr_title"
    default: "feat: automated PR with security scan"

# Add custom steps before the inherited ones
steps:
  - name: "Security scan"
    type: "command"
    command: "npm audit --audit-level=moderate"
    continue_on_error: false

  - name: "Dependency check"
    type: "command"
    command: "npm outdated"
    continue_on_error: true

# The rest of the steps are inherited from the global template
```

### Example 3: Multi-Language Project

```bash
# In a project with multiple languages
$ ls
package.json  pyproject.toml  Cargo.toml  src/

$ npx prompts-workflow-mcp list
Available workflows for Multi-language project:
  📦 JavaScript workflows:
    ✓ js-create-pr - JavaScript PR workflow
    ✓ js-test - JavaScript testing
  🐍 Python workflows:
    ✓ py-create-pr - Python PR workflow
    ✓ py-lint - Python linting
  🦀 Rust workflows:
    ✓ rust-create-pr - Rust PR workflow
    ✓ rust-build - Rust building

# Execute language-specific workflow
$ npx prompts-workflow-mcp execute py-create-pr
```

## 📝 Workflow Definition Format

Workflows are defined using YAML format with Markdown documentation support:

```yaml
name: "create-pr"
description: "Create a pull request with automated checks"
version: "1.0.0"
scope: "global"  # or "project"
tags: ["git", "testing", "ci"]

parameters:
  - name: "pr_title"
    description: "Title for the pull request"
    type: "string"
    required: false
    default: "feat: automated PR creation"

steps:
  - name: "Run linter"
    type: "command"
    command: "npm run lint"
    continue_on_error: false
    timeout: 60000

  - name: "Run tests"
    type: "command"
    command: "npm test"
    continue_on_error: false

  - name: "Create PR"
    type: "action"
    action: "github.create_pr"
    parameters:
      title: "{{ pr_title }}"
      description: "{{ pr_description }}"
      auto_clean_augment: true

environment:
  NODE_ENV: "test"
  CI: "true"

timeout: 600000
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
