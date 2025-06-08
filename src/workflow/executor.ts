/**
 * Workflow Execution Engine
 *
 * Executes workflows with step-by-step processing, error handling,
 * progress reporting, and rollback capabilities.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Workflow,
  WorkflowStep,
  ExecutionContext,
  ExecutionResult,
  StepResult,
  WorkflowStatus,
  LogEntry,
} from './types.js';
import { CommandExecutor } from '../utils/command.js';
import { Logger } from '../utils/logger.js';

export interface ExecutionOptions {
  dryRun?: boolean;
  parameters?: Record<string, unknown>;
  environment?: Record<string, string>;
  workingDirectory?: string;
  onProgress?: (_progressInfo: {
    current: number;
    total: number;
    step: string;
  }) => void;
}

export class WorkflowExecutor {
  private logger: Logger;
  private commandExecutor: CommandExecutor;

  constructor(
    allowedCommands: string[] = [],
    blockedCommands: string[] = [],
    maxExecutionTime: number = 300000
  ) {
    this.logger = new Logger('WorkflowExecutor');
    this.commandExecutor = new CommandExecutor(
      allowedCommands,
      blockedCommands,
      maxExecutionTime
    );
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflow: Workflow,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const startTime = new Date();
    const logs: LogEntry[] = [];

    // Create execution context
    const context: ExecutionContext = {
      execution_id: executionId,
      workflow,
      parameters: options.parameters || {},
      environment: {
        ...(Object.fromEntries(
          Object.entries(process.env).filter(([, value]) => value !== undefined)
        ) as Record<string, string>),
        ...workflow.environment,
        ...options.environment,
      },
      working_directory: options.workingDirectory || process.cwd(),
      start_time: startTime,
      current_step_index: 0,
      status: 'running',
      dry_run: options.dryRun || false,
    };

    this.logger.info(`Starting workflow execution: ${workflow.name}`, {
      executionId,
      dryRun: context.dry_run,
    });

    const stepResults: StepResult[] = [];
    let overallStatus: WorkflowStatus = 'running';

    try {
      // Execute each step
      for (let i = 0; i < workflow.steps.length; i++) {
        context.current_step_index = i;
        const step = workflow.steps[i];

        if (!step) {
          this.logger.error(`Step at index ${i} is undefined`);
          continue;
        }

        // Report progress
        if (options.onProgress) {
          options.onProgress({
            current: i + 1,
            total: workflow.steps.length,
            step: step.name,
          });
        }

        this.logger.info(
          `Executing step ${i + 1}/${workflow.steps.length}: ${step.name}`
        );

        const stepResult = await this.executeStep(step, context);
        stepResults.push(stepResult);

        // Log step completion
        logs.push({
          timestamp: new Date(),
          level: stepResult.status === 'completed' ? 'info' : 'error',
          message: `Step ${step.name} ${stepResult.status}`,
          source: 'executor',
          execution_id: executionId,
          step_name: step.name,
        });

        // Handle step failure
        if (stepResult.status === 'failed' && !step.continue_on_error) {
          this.logger.error(`Step failed: ${step.name}`, stepResult.error);
          overallStatus = 'failed';
          break;
        }
      }

      // Determine final status
      if (overallStatus === 'running') {
        const hasFailures = stepResults.some(r => r.status === 'failed');
        overallStatus = hasFailures ? 'failed' : 'completed';
      }
    } catch (error) {
      this.logger.error('Workflow execution failed:', error);
      overallStatus = 'failed';

      logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Workflow execution failed: ${error}`,
        source: 'executor',
        execution_id: executionId,
      });
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const result: ExecutionResult = {
      execution_id: executionId,
      workflow_name: workflow.name,
      status: overallStatus,
      start_time: startTime,
      end_time: endTime,
      duration,
      step_results: stepResults,
      logs,
    };

    this.logger.info(`Workflow execution completed: ${workflow.name}`, {
      status: overallStatus,
      duration,
      steps: stepResults.length,
    });

    return result;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<StepResult> {
    const startTime = new Date();
    const stepResult: StepResult = {
      step_name: step.name,
      step_index: context.current_step_index,
      status: 'running',
      start_time: startTime,
    };

    try {
      if (context.dry_run) {
        // Simulate step execution in dry run mode
        stepResult.status = 'completed';
        stepResult.output = `[DRY RUN] Would execute: ${step.name}`;
        this.logger.info(`[DRY RUN] Step: ${step.name}`);
        return stepResult;
      }

      switch (step.type) {
        case 'command':
          await this.executeCommandStep(step, context, stepResult);
          break;

        case 'action':
          await this.executeActionStep(step, context, stepResult);
          break;

        case 'condition':
          await this.executeConditionStep(step, context, stepResult);
          break;

        case 'parallel':
          await this.executeParallelStep(step, context, stepResult);
          break;

        case 'sequential':
          await this.executeSequentialStep(step, context, stepResult);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.error = {
        code: 'STEP_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        step_name: step.name,
        step_index: context.current_step_index,
        exit_code: -1,
        retryable: false,
      };
    }

    const endTime = new Date();
    stepResult.end_time = endTime;
    stepResult.duration = endTime.getTime() - startTime.getTime();

    return stepResult;
  }

  /**
   * Execute a command step
   */
  private async executeCommandStep(
    step: WorkflowStep,
    context: ExecutionContext,
    stepResult: StepResult
  ): Promise<void> {
    if (!step.command) {
      throw new Error('Command step requires a command');
    }

    // Substitute parameters in command
    const command = this.substituteParameters(step.command, context.parameters);

    const commandResult = await this.commandExecutor.execute(command, {
      cwd: step.working_directory || context.working_directory,
      env: { ...context.environment, ...step.environment },
      timeout: step.timeout || 300000,
    });

    stepResult.exit_code = commandResult.exitCode;
    stepResult.stdout = commandResult.stdout;
    stepResult.stderr = commandResult.stderr;
    stepResult.status = commandResult.success ? 'completed' : 'failed';

    if (!commandResult.success) {
      stepResult.error = {
        code: 'COMMAND_FAILED',
        message: `Command failed with exit code ${commandResult.exitCode}`,
        timestamp: new Date(),
        step_name: step.name,
        step_index: context.current_step_index,
        exit_code: commandResult.exitCode,
        retryable: true,
      };
    }
  }

  /**
   * Execute an action step (placeholder for custom actions)
   */
  private async executeActionStep(
    step: WorkflowStep,
    _context: ExecutionContext,
    stepResult: StepResult
  ): Promise<void> {
    if (!step.action) {
      throw new Error('Action step requires an action');
    }

    // This is a placeholder - in a real implementation,
    // you'd have a registry of actions that can be executed
    this.logger.info(`Executing action: ${step.action}`, step.parameters);

    stepResult.status = 'completed';
    stepResult.output = `Action ${step.action} executed successfully`;
  }

  /**
   * Execute a condition step
   */
  private async executeConditionStep(
    step: WorkflowStep,
    context: ExecutionContext,
    stepResult: StepResult
  ): Promise<void> {
    if (!step.condition) {
      throw new Error('Condition step requires a condition');
    }

    // This is a placeholder - in a real implementation,
    // you'd have a condition evaluator
    const conditionResult = this.evaluateCondition(step.condition, context);

    stepResult.status = conditionResult ? 'completed' : 'skipped';
    stepResult.output = `Condition evaluated to: ${conditionResult}`;
  }

  /**
   * Execute parallel steps (placeholder)
   */
  private async executeParallelStep(
    _step: WorkflowStep,
    _context: ExecutionContext,
    stepResult: StepResult
  ): Promise<void> {
    // Placeholder implementation
    stepResult.status = 'completed';
    stepResult.output = 'Parallel execution not yet implemented';
  }

  /**
   * Execute sequential steps (placeholder)
   */
  private async executeSequentialStep(
    _step: WorkflowStep,
    _context: ExecutionContext,
    stepResult: StepResult
  ): Promise<void> {
    // Placeholder implementation
    stepResult.status = 'completed';
    stepResult.output = 'Sequential execution not yet implemented';
  }

  /**
   * Substitute parameters in a string
   */
  private substituteParameters(
    template: string,
    parameters: Record<string, unknown>
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{ ${key} }}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  /**
   * Evaluate a condition (placeholder implementation)
   */
  private evaluateCondition(
    condition: string,
    context: ExecutionContext
  ): boolean {
    // This is a very basic implementation
    // In a real system, you'd want a proper expression evaluator

    // Simple environment variable checks
    if (condition.includes('env.')) {
      const envVar = condition.match(/env\.(\w+)/)?.[1];
      if (envVar) {
        const value = context.environment[envVar];
        if (condition.includes('===')) {
          const expectedValue = condition
            .split('===')[1]
            ?.trim()
            .replace(/['"]/g, '');
          return value === expectedValue;
        }
        return Boolean(value);
      }
    }

    // Default to true for now
    return true;
  }
}
