# Contributing to Prompts Workflow MCP

Thank you for your interest in contributing to Prompts Workflow MCP! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/prompts-workflow-mcp.git
   cd prompts-workflow-mcp
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Run tests**
   ```bash
   npm test
   ```
5. **Start development**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Setting Up Development Environment

1. **Prerequisites**
   - Node.js 18.x or 20.x
   - npm 9.x or later
   - Git

2. **Environment Setup**
   ```bash
   # Install dependencies
   npm ci
   
   # Run type checking
   npm run typecheck
   
   # Run linting
   npm run lint
   
   # Run tests
   npm test
   
   # Build project
   npm run build
   ```

### Code Style and Standards

- **TypeScript**: All code must be written in TypeScript with strict type checking
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Code formatting is enforced via Prettier
- **Testing**: All new features must include comprehensive tests

### Running Quality Checks

```bash
# Run all quality checks
npm run validate

# Individual checks
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint + Prettier
npm test          # Jest tests
npm run build     # Build verification
```

## 🧪 Testing

### Test Structure

```
tests/
├── workflow/           # Workflow-related tests
├── utils/             # Utility function tests
├── integration/       # Integration tests
└── fixtures/          # Test data and fixtures
```

### Writing Tests

- Use Jest for all testing
- Follow the AAA pattern (Arrange, Act, Assert)
- Include both positive and negative test cases
- Mock external dependencies appropriately

### Test Commands

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

## 📝 Documentation

### Code Documentation

- Use JSDoc comments for all public APIs
- Include examples in documentation where helpful
- Keep documentation up-to-date with code changes

### README Updates

- Update README.md for user-facing changes
- Update README_zh.md (Chinese version) to match
- Include code examples for new features

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   npm run validate
   ```

2. **Update documentation** if needed

3. **Add changelog entry** to CHANGELOG.md

4. **Rebase your branch** on the latest main
   ```bash
   git rebase main
   ```

### PR Guidelines

- **Title**: Use conventional commit format (e.g., `feat: add workflow validation`)
- **Description**: Clearly describe what changes were made and why
- **Testing**: Describe how the changes were tested
- **Breaking Changes**: Clearly mark any breaking changes

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add workflow execution progress reporting
fix: resolve command timeout handling issue
docs: update API documentation for workflow manager
test: add integration tests for MCP server
```

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Test with the latest version**
3. **Gather relevant information**:
   - Operating system and version
   - Node.js version
   - npm version
   - Error messages and stack traces

### Bug Report Template

```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Node.js: [e.g., 20.10.0]
- npm: [e.g., 10.2.3]
- Package version: [e.g., 0.1.0]

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

### Before Requesting

1. **Check existing issues** and discussions
2. **Consider the scope** - does it fit the project's goals?
3. **Think about implementation** - how might it work?

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches were considered?

## Additional Context
Any other relevant information
```

## 🏗️ Architecture Guidelines

### Project Structure

```
src/
├── server/           # MCP server implementation
├── workflow/         # Workflow management core
├── config/           # Configuration handling
├── utils/            # Shared utilities
└── cli/              # Command-line interface

templates/            # Built-in workflow templates
schemas/              # JSON schemas for validation
examples/             # Configuration examples
docs/                 # Additional documentation
```

### Design Principles

1. **Modularity**: Keep components loosely coupled
2. **Type Safety**: Leverage TypeScript's type system
3. **Error Handling**: Provide clear, actionable error messages
4. **Performance**: Consider performance implications of changes
5. **Security**: Follow security best practices

## 📚 Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 🤝 Community

- **Discussions**: Use GitHub Discussions for questions and ideas
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Code of Conduct**: Be respectful and inclusive

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Prompts Workflow MCP! 🎉
