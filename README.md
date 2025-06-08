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

## 🔧 Configuration

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "prompts-workflow": {
      "command": "npx",
      "args": ["prompts-workflow-mcp"],
      "env": {
        "PROMPTS_WORKFLOW_GLOBAL_PATH": "~/.prompts-workflow",
        "PROMPTS_WORKFLOW_LOG_LEVEL": "info",
        "DEBUG": "prompts-workflow:*"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PROMPTS_WORKFLOW_GLOBAL_PATH` | Global templates directory | `~/.prompts-workflow` | `/custom/templates` |
| `PROMPTS_WORKFLOW_LOG_LEVEL` | Logging level | `info` | `debug`, `warn`, `error` |
| `PROMPTS_WORKFLOW_CONFIG_PATH` | Custom config file path | `~/.prompts-workflow/config.yaml` | `/etc/prompts-workflow.yaml` |
| `PROMPTS_WORKFLOW_CACHE_DIR` | Cache directory | `~/.prompts-workflow/cache` | `/tmp/workflow-cache` |
| `PROMPTS_WORKFLOW_TIMEOUT` | Default timeout (ms) | `300000` | `600000` |
| `DEBUG` | Debug namespaces | - | `prompts-workflow:*` |
| `NODE_ENV` | Environment mode | `production` | `development`, `test` |

### Configuration Files

#### Global Configuration
```yaml
# ~/.prompts-workflow/config.yaml
templates_path: "~/.prompts-workflow/templates"
default_timeout: 300000
auto_cleanup: true

logging:
  level: "info"
  format: "json"
  outputs: ["console"]
  file_logging: false

integrations:
  github:
    auto_clean_augment_descriptions: true
    default_branch: "main"

project_detection:
  javascript:
    files: ["package.json"]
    patterns: ["*.js", "*.ts", "*.jsx", "*.tsx"]
    default_workflows: ["create-pr", "run-tests"]
  python:
    files: ["pyproject.toml", "requirements.txt", "setup.py"]
    patterns: ["*.py"]
    default_workflows: ["create-pr", "lint", "test"]

security:
  sandbox_mode: true
  max_execution_time: 3600000
  allowed_commands: ["npm", "node", "python", "pip", "cargo", "go"]
```

#### Project Configuration
```yaml
# .prompts-workflow/config.yaml (in your project)
name: "my-awesome-project"
type: "javascript"

workflows:
  create-pr:
    parameters:
      pr_title: "feat: automated changes"
      run_security_scan: true
    environment:
      NODE_ENV: "test"

  deploy:
    extends: "templates/javascript/deploy"
    parameters:
      target_env: "staging"

environment:
  CI: "true"
  CUSTOM_VAR: "project-specific-value"

integrations:
  github:
    repository:
      owner: "myorg"
      name: "my-awesome-project"
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
│   ├── javascript/        # JavaScript project templates
│   ├── python/           # Python project templates
│   ├── rust/             # Rust project templates
│   └── go/               # Go project templates
├── schemas/               # JSON schemas
├── tests/                 # Test suites
├── docs/                  # Documentation
└── examples/              # Usage examples
```

## 🛠️ Development & Debugging

### Prerequisites

- **Node.js**: 20.x or later
- **npm**: 9.x or later
- **Git**: For version control

### Local Development Setup

#### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/loonghao/prompts-workflow-mcp.git
cd prompts-workflow-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

#### 2. Development Scripts

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Validate project configuration
npm run validate
```

#### 3. Local Testing

```bash
# Test CLI locally
node dist/cli/index.js --help
node dist/cli/index.js list
node dist/cli/index.js validate templates/javascript/create-pr.yaml

# Test MCP server locally
node dist/server/mcp-server.js

# Test with a sample project
cd /path/to/your/test/project
npx /path/to/prompts-workflow-mcp list
```

### Debugging

#### 1. CLI Debugging

```bash
# Enable debug logging
DEBUG=prompts-workflow:* node dist/cli/index.js list

# Debug specific components
DEBUG=prompts-workflow:manager node dist/cli/index.js execute create-pr

# Use Node.js inspector
node --inspect-brk dist/cli/index.js list
# Then open chrome://inspect in Chrome
```

#### 2. MCP Server Debugging

```bash
# Start MCP server with debug logging
DEBUG=prompts-workflow:* node dist/server/mcp-server.js

# Test MCP server with stdio
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}' | node dist/server/mcp-server.js

# Debug with VS Code
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug MCP Server",
  "program": "${workspaceFolder}/dist/server/mcp-server.js",
  "env": {
    "DEBUG": "prompts-workflow:*"
  }
}
```

#### 3. Integration Testing

```bash
# Test with real MCP client (Claude Desktop)
# 1. Build the project
npm run build

# 2. Link globally for testing
npm link

# 3. Update Claude Desktop config
# ~/.claude_desktop_config.json (macOS)
# %APPDATA%/Claude/claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "prompts-workflow-dev": {
      "command": "prompts-workflow-mcp",
      "env": {
        "DEBUG": "prompts-workflow:*",
        "PROMPTS_WORKFLOW_GLOBAL_PATH": "/path/to/dev/templates"
      }
    }
  }
}

# 4. Restart Claude Desktop and test
```

### Development Workflow

#### 1. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run dev  # Watch mode for development

# Run tests
npm test

# Check code quality
npm run lint
npm run format
```

#### 2. Testing Changes

```bash
# Test specific workflow
node dist/cli/index.js execute create-pr --dry-run

# Test project detection
node dist/cli/index.js detect /path/to/test/project

# Test template validation
node dist/cli/index.js validate templates/python/create-pr.yaml

# Test with different project types
mkdir test-js && cd test-js && npm init -y
node ../dist/cli/index.js list  # Should detect JavaScript

mkdir test-py && cd test-py && touch pyproject.toml
node ../dist/cli/index.js list  # Should detect Python
```

#### 3. Debugging Common Issues

**Issue: "Module not found" errors**
```bash
# Ensure build is up to date
npm run build

# Check TypeScript compilation
npx tsc --noEmit
```

**Issue: MCP server not responding**
```bash
# Test server manually
echo '{"jsonrpc": "2.0", "id": 1, "method": "ping"}' | node dist/server/mcp-server.js

# Check for port conflicts
lsof -i :3000  # or whatever port you're using
```

**Issue: Workflow execution fails**
```bash
# Enable verbose logging
DEBUG=prompts-workflow:* node dist/cli/index.js execute workflow-name

# Test in dry-run mode
node dist/cli/index.js execute workflow-name --dry-run

# Check workflow syntax
node dist/cli/index.js validate path/to/workflow.yaml
```

### Contributing Guidelines

#### 1. Code Style

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation for API changes

#### 2. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new workflow template for Go projects
fix: resolve project detection issue for monorepos
docs: update API documentation
test: add integration tests for MCP server
chore: update dependencies
```

#### 3. Pull Request Process

```bash
# 1. Ensure all tests pass
npm test

# 2. Ensure code quality
npm run lint
npm run format

# 3. Update documentation if needed
# 4. Create PR with descriptive title and body
# 5. Ensure CI passes
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Installation Issues

**Problem**: `npm install` fails with permission errors
```bash
# Solution: Use npm's built-in permission fix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use npx for one-time execution
npx prompts-workflow-mcp --help
```

**Problem**: TypeScript compilation errors
```bash
# Solution: Ensure compatible Node.js version
node --version  # Should be 20.x or later
npm install typescript@latest -g
npm run build
```

#### 2. Runtime Issues

**Problem**: "Project type not detected"
```bash
# Debug project detection
DEBUG=prompts-workflow:detector npx prompts-workflow-mcp detect .

# Check for required files
ls -la  # Look for package.json, pyproject.toml, etc.

# Force project type
npx prompts-workflow-mcp list --type javascript
```

**Problem**: "Workflow not found"
```bash
# List available workflows
npx prompts-workflow-mcp list --verbose

# Check workflow paths
npx prompts-workflow-mcp config --show-paths

# Validate workflow syntax
npx prompts-workflow-mcp validate path/to/workflow.yaml
```

**Problem**: MCP server connection issues
```bash
# Test MCP server directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}' | npx prompts-workflow-mcp

# Check Claude Desktop logs (macOS)
tail -f ~/Library/Logs/Claude/claude_desktop.log

# Check Claude Desktop logs (Windows)
Get-Content "$env:APPDATA\Claude\logs\claude_desktop.log" -Wait
```

#### 3. Performance Issues

**Problem**: Slow workflow execution
```bash
# Enable performance profiling
DEBUG=prompts-workflow:perf npx prompts-workflow-mcp execute workflow-name

# Use dry-run to test without execution
npx prompts-workflow-mcp execute workflow-name --dry-run

# Check system resources
top  # or htop on Linux/macOS
```

### Getting Help

#### 1. Enable Debug Logging

```bash
# Full debug output
DEBUG=prompts-workflow:* npx prompts-workflow-mcp command

# Specific component debugging
DEBUG=prompts-workflow:manager npx prompts-workflow-mcp list
DEBUG=prompts-workflow:executor npx prompts-workflow-mcp execute workflow-name
DEBUG=prompts-workflow:detector npx prompts-workflow-mcp detect
```

#### 2. Generate Debug Report

```bash
# Create a debug report
npx prompts-workflow-mcp debug-report > debug-report.txt

# The report includes:
# - System information
# - Project detection results
# - Available workflows
# - Configuration status
# - Recent logs
```

#### 3. Community Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/loonghao/prompts-workflow-mcp/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/loonghao/prompts-workflow-mcp/discussions)
- **Documentation**: [Check the docs](./docs/)

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
