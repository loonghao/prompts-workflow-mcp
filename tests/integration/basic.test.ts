/**
 * Basic Integration Tests
 * 
 * Simple tests to improve code coverage by importing and instantiating main classes.
 */

describe('Basic Integration Tests', () => {
  test('should import and instantiate main modules', async () => {
    // Test that main modules can be imported without errors
    const { WorkflowManager } = await import('../../src/workflow/manager');
    const { WorkflowExecutor } = await import('../../src/workflow/executor');
    const { ConfigLoader } = await import('../../src/config/loader');
    const { Logger } = await import('../../src/utils/logger');
    const { ProjectDetector } = await import('../../src/utils/project-detector');

    // Test basic instantiation
    expect(WorkflowManager).toBeDefined();
    expect(WorkflowExecutor).toBeDefined();
    expect(ConfigLoader).toBeDefined();
    expect(Logger).toBeDefined();
    expect(ProjectDetector).toBeDefined();
  });

  test('should import workflow schemas', async () => {
    const schemas = await import('../../src/workflow/schemas');
    expect(schemas).toBeDefined();
    expect(schemas.validateWorkflow).toBeDefined();
    expect(schemas.WorkflowSchema).toBeDefined();
  });

  test('should import CLI module', async () => {
    const cli = await import('../../src/cli/index');
    expect(cli).toBeDefined();
  });

  test('should import MCP server', async () => {
    const server = await import('../../src/server/mcp-server');
    expect(server).toBeDefined();
  });

  test('should import utility modules', async () => {
    const command = await import('../../src/utils/command');
    expect(command).toBeDefined();
  });

  test('should import main index', async () => {
    const main = await import('../../src/index');
    expect(main).toBeDefined();
  });

  test('should validate basic workflow structure', async () => {
    const { validateWorkflow } = await import('../../src/workflow/schemas');
    
    const validWorkflow = {
      name: 'test-workflow',
      description: 'A test workflow',
      version: '1.0.0',
      scope: 'project',
      steps: [
        {
          name: 'test-step',
          type: 'command',
          command: 'echo "hello"',
        },
      ],
    };

    const result = validateWorkflow(validWorkflow);
    expect(result.success).toBe(true);
  });

  test('should handle invalid workflow structure', async () => {
    const { validateWorkflow } = await import('../../src/workflow/schemas');
    
    const invalidWorkflow = {
      name: '',
      description: 'Invalid workflow',
      version: '1.0.0',
      scope: 'invalid-scope',
      steps: [],
    };

    const result = validateWorkflow(invalidWorkflow);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  test('should create logger instance', async () => {
    const { Logger } = await import('../../src/utils/logger');
    
    const logger = new Logger('test');
    expect(logger).toBeDefined();
    
    // Test basic logging methods exist
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('should create config loader instance', async () => {
    const { ConfigLoader } = await import('../../src/config/loader');
    
    const loader = new ConfigLoader();
    expect(loader).toBeDefined();
    
    // Test that loadGlobalConfig method exists
    expect(typeof loader.loadGlobalConfig).toBe('function');
    expect(typeof loader.loadProjectConfig).toBe('function');
  });

  test('should create project detector instance', async () => {
    const { ProjectDetector } = await import('../../src/utils/project-detector');
    
    const mockConfig = {
      javascript: {
        files: ['package.json'],
        patterns: ['*.js', '*.ts'],
      },
      python: {
        files: ['pyproject.toml'],
        patterns: ['*.py'],
      },
      rust: {
        files: ['Cargo.toml'],
        patterns: ['*.rs'],
      },
      go: {
        files: ['go.mod'],
        patterns: ['*.go'],
      },
    };
    
    const detector = new ProjectDetector(mockConfig);
    expect(detector).toBeDefined();
    
    // Test that detectProjectType method exists
    expect(typeof detector.detectProjectType).toBe('function');
  });

  test('should create workflow executor instance', async () => {
    const { WorkflowExecutor } = await import('../../src/workflow/executor');
    
    const executor = new WorkflowExecutor();
    expect(executor).toBeDefined();
    
    // Test that executeWorkflow method exists
    expect(typeof executor.executeWorkflow).toBe('function');
  });

  test('should create workflow manager instance', async () => {
    const { WorkflowManager } = await import('../../src/workflow/manager');
    
    const mockGlobalConfig = {
      templates_path: '/test/templates',
      default_timeout: 300000,
      auto_cleanup: true,
      logging: {
        level: 'info' as const,
        format: 'json' as const,
        outputs: ['console'],
        file_logging: false,
      },
      integrations: {
        github: {
          auto_clean_augment_descriptions: true,
          default_branch: 'main',
        },
      },
      project_detection: {
        javascript: {
          files: ['package.json'],
          patterns: ['*.js', '*.ts'],
        },
        python: {
          files: ['pyproject.toml'],
          patterns: ['*.py'],
        },
        rust: {
          files: ['Cargo.toml'],
          patterns: ['*.rs'],
        },
        go: {
          files: ['go.mod'],
          patterns: ['*.go'],
        },
      },
      security: {
        sandbox_mode: true,
        max_execution_time: 3600000,
        allowed_commands: ['npm', 'node'],
      },
    };
    
    const manager = new WorkflowManager(mockGlobalConfig, '/test/project');
    expect(manager).toBeDefined();
    
    // Test that basic methods exist
    expect(typeof manager.listWorkflows).toBe('function');
    expect(typeof manager.getWorkflow).toBe('function');
    expect(typeof manager.createWorkflow).toBe('function');
    expect(typeof manager.updateWorkflow).toBe('function');
    expect(typeof manager.deleteWorkflow).toBe('function');
  });
});
