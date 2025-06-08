/**
 * Workflow Executor Unit Tests
 * 
 * Tests for workflow execution engine and step processing.
 */

import { WorkflowExecutor } from '../../src/workflow/executor';
import { Workflow, ExecutionContext, WorkflowStep } from '../../src/workflow/types';
import { exec } from 'child_process';
import { promisify } from 'util';

// Mock child_process
jest.mock('child_process');
const mockExec = exec as jest.MockedFunction<typeof exec>;

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
    jest.clearAllMocks();
  });

  describe('executeWorkflow', () => {
    test('should execute a simple workflow successfully', async () => {
      const workflow: Workflow = {
        name: 'test-workflow',
        description: 'A test workflow',
        version: '1.0.0',
        scope: 'project',
        steps: [
          {
            name: 'echo-step',
            type: 'command',
            command: 'echo "hello world"',
          },
        ],
      };

      const context: ExecutionContext = {
        execution_id: 'test-123',
        workflow,
        parameters: {},
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: false,
      };

      // Mock successful command execution
      (mockExec as any).mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'hello world\n', stderr: '' });
      });

      const result = await executor.executeWorkflow(context);

      expect(result.status).toBe('completed');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0]?.status).toBe('completed');
      expect(result.step_results[0]?.exit_code).toBe(0);
    });

    test('should handle command execution failure', async () => {
      const workflow: Workflow = {
        name: 'failing-workflow',
        description: 'A workflow that fails',
        version: '1.0.0',
        scope: 'project',
        steps: [
          {
            name: 'failing-step',
            type: 'command',
            command: 'exit 1',
          },
        ],
      };

      const context: ExecutionContext = {
        execution_id: 'test-456',
        workflow,
        parameters: {},
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: false,
      };

      // Mock failed command execution
      (mockExec as any).mockImplementation((command: string, callback: Function) => {
        const error = new Error('Command failed') as any;
        error.code = 1;
        callback(error, { stdout: '', stderr: 'Command failed' });
      });

      const result = await executor.executeWorkflow(context);

      expect(result.status).toBe('failed');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0]?.status).toBe('failed');
      expect(result.step_results[0]?.exit_code).toBe(1);
    });

    test('should continue on error when configured', async () => {
      const workflow: Workflow = {
        name: 'continue-on-error-workflow',
        description: 'A workflow that continues on error',
        version: '1.0.0',
        scope: 'project',
        steps: [
          {
            name: 'failing-step',
            type: 'command',
            command: 'exit 1',
            continue_on_error: true,
          },
          {
            name: 'success-step',
            type: 'command',
            command: 'echo "success"',
          },
        ],
      };

      const context: ExecutionContext = {
        execution_id: 'test-789',
        workflow,
        parameters: {},
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: false,
      };

      // Mock first command fails, second succeeds
      (mockExec as any)
        .mockImplementationOnce((command: string, callback: Function) => {
          const error = new Error('Command failed') as any;
          error.code = 1;
          callback(error, { stdout: '', stderr: 'Command failed' });
        })
        .mockImplementationOnce((command: string, callback: Function) => {
          callback(null, { stdout: 'success\n', stderr: '' });
        });

      const result = await executor.executeWorkflow(context);

      expect(result.status).toBe('completed');
      expect(result.step_results).toHaveLength(2);
      expect(result.step_results[0]?.status).toBe('failed');
      expect(result.step_results[1]?.status).toBe('completed');
    });

    test('should handle dry run mode', async () => {
      const workflow: Workflow = {
        name: 'dry-run-workflow',
        description: 'A workflow for dry run testing',
        version: '1.0.0',
        scope: 'project',
        steps: [
          {
            name: 'dry-run-step',
            type: 'command',
            command: 'echo "this should not execute"',
          },
        ],
      };

      const context: ExecutionContext = {
        execution_id: 'test-dry',
        workflow,
        parameters: {},
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: true,
      };

      const result = await executor.executeWorkflow(context);

      expect(result.status).toBe('completed');
      expect(result.step_results).toHaveLength(1);
      expect(result.step_results[0]?.status).toBe('skipped');
      expect(mockExec).not.toHaveBeenCalled();
    });
  });

  describe('executeStep', () => {
    test('should execute command step', async () => {
      const step: WorkflowStep = {
        name: 'test-command',
        type: 'command',
        command: 'echo "test"',
      };

      const context: ExecutionContext = {
        execution_id: 'test-step',
        workflow: {
          name: 'test',
          description: 'test',
          version: '1.0.0',
          scope: 'project',
          steps: [step],
        },
        parameters: {},
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: false,
      };

      (mockExec as any).mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'test\n', stderr: '' });
      });

      const result = await executor.executeStep(step, context);

      expect(result.status).toBe('completed');
      expect(result.exit_code).toBe(0);
      expect(result.output).toBe('test\n');
    });

    test('should handle step timeout', async () => {
      const step: WorkflowStep = {
        name: 'timeout-step',
        type: 'command',
        command: 'sleep 10',
        timeout: 1000, // 1 second timeout
      };

      const context: ExecutionContext = {
        execution_id: 'test-timeout',
        workflow: {
          name: 'test',
          description: 'test',
          version: '1.0.0',
          scope: 'project',
          steps: [step],
        },
        parameters: {},
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: false,
      };

      // Mock long-running command
      (mockExec as any).mockImplementation((command: string, callback: Function) => {
        setTimeout(() => {
          callback(null, { stdout: '', stderr: '' });
        }, 5000); // 5 seconds, longer than timeout
      });

      const result = await executor.executeStep(step, context);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('timeout');
    });

    test('should substitute parameters in commands', async () => {
      const step: WorkflowStep = {
        name: 'parameterized-step',
        type: 'command',
        command: 'echo "{{ message }}"',
      };

      const context: ExecutionContext = {
        execution_id: 'test-params',
        workflow: {
          name: 'test',
          description: 'test',
          version: '1.0.0',
          scope: 'project',
          steps: [step],
        },
        parameters: {
          message: 'Hello, World!',
        },
        environment: {},
        working_directory: '/tmp',
        start_time: new Date(),
        current_step_index: 0,
        status: 'running',
        dry_run: false,
      };

      (mockExec as any).mockImplementation((command: string, callback: Function) => {
        expect(command).toBe('echo "Hello, World!"');
        callback(null, { stdout: 'Hello, World!\n', stderr: '' });
      });

      const result = await executor.executeStep(step, context);

      expect(result.status).toBe('completed');
    });
  });

  describe('validateExecution', () => {
    test('should validate execution context', () => {
      const validContext: ExecutionContext = {
        execution_id: 'valid-123',
        workflow: {
          name: 'valid-workflow',
          description: 'Valid workflow',
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

      expect(() => executor.validateExecution(validContext)).not.toThrow();
    });

    test('should reject invalid execution context', () => {
      const invalidContext = {
        execution_id: '',
        workflow: null,
        parameters: {},
        environment: {},
        working_directory: '',
        start_time: new Date(),
        current_step_index: -1,
        status: 'invalid',
        dry_run: false,
      } as any;

      expect(() => executor.validateExecution(invalidContext)).toThrow();
    });
  });
});
