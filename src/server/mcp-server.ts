/**
 * MCP Server Implementation
 *
 * Core MCP server that handles protocol communication, tool registration,
 * and request processing for the Prompts Workflow system.
 *
 * Using FastMCP for simplified development experience.
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { Logger } from '../utils/logger.js';
import { ConfigLoader } from '../config/loader.js';
import { WorkflowManager } from '../workflow/manager.js';
import { WorkflowExecutor } from '../workflow/executor.js';

/**
 * Main MCP Server class that orchestrates the workflow automation system
 */
export class MCPServer {
  private server: FastMCP;
  private logger: Logger;
  private isRunning = false;
  private configLoader: ConfigLoader;
  private workflowManager: WorkflowManager | null = null;
  private workflowExecutor: WorkflowExecutor | null = null;

  constructor() {
    this.logger = new Logger('MCPServer');
    this.configLoader = new ConfigLoader();
    this.server = new FastMCP({
      name: 'prompts-workflow-mcp',
      version: '0.1.0',
    });

    this.setupTools();
    this.setupEventHandlers();
  }

  /**
   * Initialize workflow components
   */
  private async initializeComponents(): Promise<void> {
    try {
      // Load configurations
      const globalConfig = await this.configLoader.loadGlobalConfig();
      // const projectConfig = await this.configLoader.loadProjectConfig();

      if (!globalConfig) {
        throw new Error('Failed to load global configuration');
      }

      // Initialize workflow manager
      this.workflowManager = new WorkflowManager(globalConfig);

      // Initialize workflow executor
      this.workflowExecutor = new WorkflowExecutor(
        globalConfig.security.allowed_commands,
        globalConfig.security.blocked_commands,
        globalConfig.security.max_execution_time
      );

      this.logger.info('Workflow components initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize workflow components:', error);
      throw error;
    }
  }

  /**
   * Setup workflow tools using FastMCP API
   */
  private setupTools(): void {
    this.logger.info('Setting up workflow tools...');

    // List workflows tool
    this.server.addTool({
      name: 'list_workflows',
      description: 'List all available workflows (global and project-specific)',
      parameters: z.object({
        scope: z.enum(['global', 'project', 'all']).default('all').optional(),
        project_type: z.string().optional(),
      }),
      execute: async (args, { log }) => {
        log.info('Listing workflows', args);

        try {
          if (!this.workflowManager) {
            await this.initializeComponents();
          }

          const scope = args.scope || 'all';
          const workflows = await this.workflowManager!.listWorkflows(scope);

          if (workflows.length === 0) {
            return `No workflows found (scope: ${scope}).\n\nTo create your first workflow, use the create_workflow tool.`;
          }

          let result = `Found ${workflows.length} workflow(s) (scope: ${scope}):\n\n`;

          for (const workflow of workflows) {
            result += `• **${workflow.name}** (${workflow.scope})\n`;
            result += `  ${workflow.description}\n`;
            result += `  Version: ${workflow.version}\n`;
            if (workflow.tags && workflow.tags.length > 0) {
              result += `  Tags: ${workflow.tags.join(', ')}\n`;
            }
            result += '\n';
          }

          return result;
        } catch (error) {
          log.error('Failed to list workflows:', String(error));
          return `Error listing workflows: ${error instanceof Error ? error.message : String(error)}`;
        }
      },
    });

    // Get workflow tool
    this.server.addTool({
      name: 'get_workflow',
      description: 'Get detailed information about a specific workflow',
      parameters: z.object({
        name: z.string(),
        scope: z.enum(['global', 'project']).default('project').optional(),
      }),
      execute: async (args, { log }) => {
        log.info('Getting workflow', args);

        try {
          if (!this.workflowManager) {
            await this.initializeComponents();
          }

          const name = args.name;
          const scope = args.scope;
          const workflow = await this.workflowManager!.getWorkflow(name, scope);

          if (!workflow) {
            return `Workflow "${name}" not found${scope ? ` in ${scope} scope` : ''}.`;
          }

          let result = `# Workflow: ${workflow.name}\n\n`;
          result += `**Description:** ${workflow.description}\n`;
          result += `**Version:** ${workflow.version}\n`;
          result += `**Scope:** ${workflow.scope}\n\n`;

          if (workflow.tags && workflow.tags.length > 0) {
            result += `**Tags:** ${workflow.tags.join(', ')}\n\n`;
          }

          result += `## Steps (${workflow.steps.length}):\n\n`;
          for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            if (step) {
              result += `${i + 1}. **${step.name}** (${step.type})\n`;
              if (step.command) {
                result += `   Command: \`${step.command}\`\n`;
              }
              if (step.action) {
                result += `   Action: ${step.action}\n`;
              }
              result += '\n';
            }
          }

          return result;
        } catch (error) {
          log.error('Failed to get workflow:', String(error));
          return `Error getting workflow: ${error instanceof Error ? error.message : String(error)}`;
        }
      },
    });

    // Execute workflow tool
    this.server.addTool({
      name: 'execute_workflow',
      description: 'Execute a workflow with optional parameters',
      parameters: z.object({
        name: z.string(),
        parameters: z.record(z.unknown()).optional(),
        dry_run: z.boolean().default(false).optional(),
      }),
      execute: async (args, { log, reportProgress }) => {
        log.info('Executing workflow', {
          name: args.name,
          dryRun: args.dry_run,
        });

        try {
          if (!this.workflowManager || !this.workflowExecutor) {
            await this.initializeComponents();
          }

          const name = args.name;
          const parameters = args.parameters || {};
          const dryRun = args.dry_run || false;

          // Get the workflow
          const workflow = await this.workflowManager!.getWorkflow(name);
          if (!workflow) {
            return `Workflow "${name}" not found.`;
          }

          // Execute the workflow
          const result = await this.workflowExecutor!.executeWorkflow(
            workflow,
            {
              dryRun,
              parameters,
              onProgress: progress => {
                reportProgress({
                  progress: Math.round(
                    (progress.current / progress.total) * 100
                  ),
                  total: 100,
                });
              },
            }
          );

          let output = `${dryRun ? '[DRY RUN] ' : ''}Workflow "${name}" execution ${result.status}\n\n`;

          if (result.status === 'completed') {
            output += `✅ Execution completed successfully\n`;
          } else if (result.status === 'failed') {
            output += `❌ Execution failed\n`;
          }

          output += `Duration: ${result.duration}ms\n`;
          output += `Steps completed: ${result.step_results.filter(s => s.status === 'completed').length}/${result.step_results.length}\n\n`;

          // Add step details
          for (const stepResult of result.step_results) {
            const icon =
              stepResult.status === 'completed'
                ? '✅'
                : stepResult.status === 'failed'
                  ? '❌'
                  : stepResult.status === 'skipped'
                    ? '⏭️'
                    : '⏸️';

            output += `${icon} ${stepResult.step_name} (${stepResult.duration || 0}ms)\n`;

            if (stepResult.stdout) {
              output += `   Output: ${stepResult.stdout.substring(0, 200)}${stepResult.stdout.length > 200 ? '...' : ''}\n`;
            }

            if (stepResult.error) {
              output += `   Error: ${stepResult.error.message}\n`;
            }
          }

          return output;
        } catch (error) {
          log.error('Failed to execute workflow:', String(error));
          return `Error executing workflow: ${error instanceof Error ? error.message : String(error)}`;
        }
      },
    });

    // Create workflow tool
    this.server.addTool({
      name: 'create_workflow',
      description: 'Create a new workflow from Markdown definition',
      parameters: z.object({
        name: z.string(),
        content: z.string(),
        scope: z.enum(['global', 'project']).default('project').optional(),
      }),
      execute: async (args, { log }) => {
        log.info('Creating workflow', { name: args.name, scope: args.scope });

        try {
          if (!this.workflowManager) {
            await this.initializeComponents();
          }

          const name = args.name;
          const content = args.content;
          const scope = args.scope || 'project';

          const success = await this.workflowManager!.createWorkflow(
            name,
            content,
            scope
          );

          if (success) {
            return `✅ Workflow "${name}" created successfully in ${scope} scope.\n\nYou can now execute it using: execute_workflow with name "${name}"`;
          } else {
            return `❌ Failed to create workflow "${name}". Please check the workflow definition and try again.`;
          }
        } catch (error) {
          log.error('Failed to create workflow:', String(error));
          return `Error creating workflow: ${error instanceof Error ? error.message : String(error)}`;
        }
      },
    });

    // Validate workflow tool
    this.server.addTool({
      name: 'validate_workflow',
      description: 'Validate a workflow definition without creating it',
      parameters: z.object({
        content: z.string(),
      }),
      execute: async (args, { log }) => {
        log.info('Validating workflow content');

        try {
          const content = args.content;

          // Try to parse as YAML first
          let workflowData;
          try {
            const YAML = await import('yaml');
            workflowData = YAML.parse(content);
          } catch {
            return `❌ Invalid YAML format. Please check your workflow definition syntax.`;
          }

          // Validate against schema
          const { validateWorkflow } = await import('../workflow/schemas.js');
          const validation = validateWorkflow(workflowData);

          if (validation.success) {
            const workflow = validation.data;
            let result = `✅ Workflow validation passed!\n\n`;
            result += `**Name:** ${workflow.name}\n`;
            result += `**Description:** ${workflow.description}\n`;
            result += `**Version:** ${workflow.version}\n`;
            result += `**Scope:** ${workflow.scope}\n`;
            result += `**Steps:** ${workflow.steps.length}\n\n`;

            if (workflow.steps.length > 0) {
              result += `**Step Summary:**\n`;
              for (let i = 0; i < workflow.steps.length; i++) {
                const step = workflow.steps[i];
                if (step) {
                  result += `${i + 1}. ${step.name} (${step.type})\n`;
                }
              }
            }

            return result;
          } else {
            let result = `❌ Workflow validation failed:\n\n`;
            if (validation.errors) {
              for (const error of validation.errors) {
                result += `• ${error}\n`;
              }
            }
            return result;
          }
        } catch (error) {
          log.error('Failed to validate workflow:', String(error));
          return `Error validating workflow: ${error instanceof Error ? error.message : String(error)}`;
        }
      },
    });

    this.logger.info('Workflow tools setup completed');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.server.on('connect', event => {
      this.logger.info('Client connected', { sessionId: event.session });
    });

    this.server.on('disconnect', event => {
      this.logger.info('Client disconnected', { sessionId: event.session });
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return;
    }

    try {
      this.logger.info('Starting Prompts Workflow MCP Server...');

      // Initialize workflow components
      await this.initializeComponents();

      // Start the FastMCP server with stdio transport
      await this.server.start({
        transportType: 'stdio',
      });

      this.isRunning = true;
      this.logger.info('MCP Server started successfully');
      this.logger.info('Server is ready to accept requests via stdio');
    } catch (error) {
      this.logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Server is not running');
      return;
    }

    try {
      this.logger.info('Stopping MCP Server...');

      // FastMCP handles cleanup automatically
      // No explicit close method needed

      this.isRunning = false;
      this.logger.info('MCP Server stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping MCP server:', error);
      throw error;
    }
  }

  /**
   * Get server running status
   */
  get running(): boolean {
    return this.isRunning;
  }
}
