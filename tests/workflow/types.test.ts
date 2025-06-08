/**
 * Workflow Types Unit Tests
 * 
 * Tests for workflow data models and type definitions.
 * Following Node.js MCP testing best practices.
 */

import {
  Workflow,
  WorkflowStep,
  ExecutionContext,
  ExecutionResult,
  isWorkflow,
  isWorkflowStep,
  isWorkflowError,
  WorkflowError,
} from '../../src/workflow/types';

import {
  WorkflowStepSchema,
  validateWorkflow,
  validateProjectConfig,
  validateGlobalConfig,
} from '../../src/workflow/schemas';

describe('Workflow Types', () => {
  describe('Type Guards', () => {
    test('isWorkflow should correctly identify valid workflows', () => {
      const validWorkflow: Workflow = {
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

      expect(isWorkflow(validWorkflow)).toBe(true);
      expect(isWorkflow({})).toBe(false);
      expect(isWorkflow(null)).toBe(false);
      expect(isWorkflow('not an object')).toBe(false);
    });

    test('isWorkflowStep should correctly identify valid workflow steps', () => {
      const validStep: WorkflowStep = {
        name: 'test-step',
        type: 'command',
        command: 'echo "hello"',
      };

      expect(isWorkflowStep(validStep)).toBe(true);
      expect(isWorkflowStep({})).toBe(false);
      expect(isWorkflowStep({ name: 'test', type: 'invalid' })).toBe(false);
    });

    test('isWorkflowError should correctly identify workflow errors', () => {
      const validError: WorkflowError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        timestamp: new Date(),
      };

      expect(isWorkflowError(validError)).toBe(true);
      expect(isWorkflowError({})).toBe(false);
      expect(isWorkflowError(new Error('regular error'))).toBe(false);
    });
  });

  describe('Workflow Schema Validation', () => {
    test('should validate a complete workflow', () => {
      const workflow = {
        name: 'test-workflow',
        description: 'A comprehensive test workflow',
        version: '1.0.0',
        scope: 'project',
        tags: ['test', 'example'],
        steps: [
          {
            name: 'setup',
            type: 'command',
            command: 'npm install',
            timeout: 30000,
          },
          {
            name: 'test',
            type: 'command',
            command: 'npm test',
            continue_on_error: false,
          },
        ],
        timeout: 300000,
        environment: {
          NODE_ENV: 'test',
        },
      };

      const result = validateWorkflow(workflow);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    test('should reject invalid workflow', () => {
      const invalidWorkflow = {
        name: '', // Invalid: empty name
        description: 'Test',
        version: 'invalid-version', // Invalid: not semver
        scope: 'invalid-scope', // Invalid: not in enum
        steps: [], // Invalid: empty steps array
      };

      const result = validateWorkflow(invalidWorkflow);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('should validate workflow steps with different types', () => {
      const commandStep = {
        name: 'command-step',
        type: 'command',
        command: 'echo "test"',
      };

      const actionStep = {
        name: 'action-step',
        type: 'action',
        action: 'github.create_pr',
        parameters: {
          title: 'Test PR',
        },
      };

      const conditionStep = {
        name: 'condition-step',
        type: 'condition',
        condition: 'env.NODE_ENV === "production"',
      };

      expect(() => WorkflowStepSchema.parse(commandStep)).not.toThrow();
      expect(() => WorkflowStepSchema.parse(actionStep)).not.toThrow();
      expect(() => WorkflowStepSchema.parse(conditionStep)).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    test('should validate project configuration', () => {
      const projectConfig = {
        name: 'test-project',
        type: 'javascript',
        workflows: {
          'test-workflow': {
            extends: 'global:javascript/test',
            parameters: {
              test_command: 'npm test',
            },
          },
        },
        environment: {
          NODE_ENV: 'development',
        },
      };

      const result = validateProjectConfig(projectConfig);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should validate global configuration', () => {
      const globalConfig = {
        templates_path: '/home/user/.prompts-workflow/templates',
        default_timeout: 300000,
        auto_cleanup: true,
        logging: {
          level: 'info',
          format: 'json',
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
            files: ['pyproject.toml', 'requirements.txt'],
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
          allowed_commands: ['npm', 'node', 'git'],
        },
      };

      const result = validateGlobalConfig(globalConfig);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    test('should enforce type safety for workflow parameters', () => {
      const workflow: Workflow = {
        name: 'typed-workflow',
        description: 'A workflow with typed parameters',
        version: '1.0.0',
        scope: 'project',
        steps: [
          {
            name: 'typed-step',
            type: 'command',
            command: 'echo "{{ message }}"',
          },
        ],
        parameters: [
          {
            name: 'message',
            description: 'Message to echo',
            type: 'string',
            required: true,
            default: 'Hello, World!',
          },
          {
            name: 'count',
            description: 'Number of times to repeat',
            type: 'number',
            required: false,
            default: 1,
          },
        ],
      };

      // TypeScript should enforce these types at compile time
      expect(workflow.parameters?.[0]?.type).toBe('string');
      expect(workflow.parameters?.[1]?.type).toBe('number');
      expect(workflow.parameters?.[0]?.required).toBe(true);
      expect(workflow.parameters?.[1]?.required).toBe(false);
    });

    test('should enforce type safety for execution context', () => {
      const context: ExecutionContext = {
        execution_id: '123e4567-e89b-12d3-a456-426614174000',
        workflow: {
          name: 'test-workflow',
          description: 'Test workflow',
          version: '1.0.0',
          scope: 'project',
          steps: [],
        },
        parameters: {},
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: false,
      };

      // TypeScript should enforce these types at compile time
      expect(context.status).toBe('running');
      expect(context.dry_run).toBe(false);
      expect(context.current_step_index).toBe(0);
    });

    test('should enforce type safety for execution results', () => {
      const result: ExecutionResult = {
        execution_id: '123e4567-e89b-12d3-a456-426614174000',
        workflow_name: 'test-workflow',
        status: 'completed',
        start_time: new Date(),
        end_time: new Date(),
        duration: 5000,
        step_results: [
          {
            step_name: 'test-step',
            step_index: 0,
            status: 'completed',
            start_time: new Date(),
            end_time: new Date(),
            duration: 5000,
            exit_code: 0,
          },
        ],
        logs: [],
      };

      // TypeScript should enforce these types at compile time
      expect(result.status).toBe('completed');
      expect(result.step_results[0]?.status).toBe('completed');
      expect(result.step_results[0]?.exit_code).toBe(0);
    });
  });

  describe('Extensibility', () => {
    test('should support custom metadata', () => {
      const workflow: Workflow = {
        name: 'extensible-workflow',
        description: 'A workflow with custom metadata',
        version: '1.0.0',
        scope: 'project',
        steps: [],
        metadata: {
          author: 'Test Author',
          category: 'testing',
          custom: {
            priority: 'high',
            team: 'backend',
            estimated_duration: '5 minutes',
          },
        },
      };

      expect(workflow.metadata?.author).toBe('Test Author');
      expect(workflow.metadata?.custom?.['priority']).toBe('high');
    });

    test('should support custom step parameters', () => {
      const step: WorkflowStep = {
        name: 'custom-step',
        type: 'action',
        action: 'custom.deploy',
        parameters: {
          environment: 'staging',
          replicas: 3,
          health_check: {
            path: '/health',
            timeout: 30,
          },
        },
      };

      expect(step.parameters?.['environment']).toBe('staging');
      expect(step.parameters?.['replicas']).toBe(3);
      expect((step.parameters?.['health_check'] as any)?.path).toBe('/health');
    });
  });
});
