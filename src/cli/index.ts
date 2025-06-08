#!/usr/bin/env node

/**
 * CLI Interface for Prompts Workflow MCP
 *
 * Provides a command-line interface for managing workflows
 * and testing the MCP server functionality.
 */

import { Command } from 'commander';
import { ConfigLoader } from '../config/loader.js';
import { WorkflowManager } from '../workflow/manager.js';
import { WorkflowExecutor } from '../workflow/executor.js';

const program = new Command();

program
  .name('prompts-workflow-mcp')
  .description('CLI for Prompts Workflow MCP')
  .version('0.1.0');

// List workflows command
program
  .command('list')
  .description('List available workflows')
  .option('-s, --scope <scope>', 'Workflow scope (global|project|all)', 'all')
  .action(async options => {
    try {
      const configLoader = new ConfigLoader();
      const globalConfig = await configLoader.loadGlobalConfig();
      // const projectConfig = await configLoader.loadProjectConfig();

      if (!globalConfig) {
        console.error('❌ Failed to load global configuration');
        process.exit(1);
      }

      const workflowManager = new WorkflowManager(globalConfig);
      const workflows = await workflowManager.listWorkflows(options.scope);

      if (workflows.length === 0) {
        console.log(`No workflows found (scope: ${options.scope})`);
        return;
      }

      console.log(
        `\nFound ${workflows.length} workflow(s) (scope: ${options.scope}):\n`
      );

      for (const workflow of workflows) {
        console.log(`• ${workflow.name} (${workflow.scope})`);
        console.log(`  ${workflow.description}`);
        console.log(`  Version: ${workflow.version}`);
        if (workflow.tags && workflow.tags.length > 0) {
          console.log(`  Tags: ${workflow.tags.join(', ')}`);
        }
        console.log();
      }
    } catch (error) {
      console.error('❌ Error listing workflows:', error);
      process.exit(1);
    }
  });

// Execute workflow command
program
  .command('execute <name>')
  .description('Execute a workflow')
  .option('-d, --dry-run', 'Perform a dry run without executing commands')
  .option('-p, --parameters <json>', 'Parameters as JSON string')
  .action(async (name, options) => {
    try {
      const configLoader = new ConfigLoader();
      const globalConfig = await configLoader.loadGlobalConfig();
      // const projectConfig = await configLoader.loadProjectConfig();

      if (!globalConfig) {
        console.error('❌ Failed to load global configuration');
        process.exit(1);
      }

      const workflowManager = new WorkflowManager(globalConfig);
      const workflowExecutor = new WorkflowExecutor(
        globalConfig.security.allowed_commands,
        globalConfig.security.blocked_commands,
        globalConfig.security.max_execution_time
      );

      // Get the workflow
      const workflow = await workflowManager.getWorkflow(name);
      if (!workflow) {
        console.error(`❌ Workflow "${name}" not found`);
        process.exit(1);
      }

      // Parse parameters
      let parameters = {};
      if (options.parameters) {
        try {
          parameters = JSON.parse(options.parameters);
        } catch (error) {
          console.error('❌ Invalid parameters JSON:', error);
          process.exit(1);
        }
      }

      console.log(
        `${options.dryRun ? '[DRY RUN] ' : ''}Executing workflow: ${name}\n`
      );

      // Execute the workflow
      const result = await workflowExecutor.executeWorkflow(workflow, {
        dryRun: options.dryRun,
        parameters,
        onProgress: progress => {
          console.log(
            `Progress: ${progress.current}/${progress.total} - ${progress.step}`
          );
        },
      });

      // Display results
      console.log(
        `\n${options.dryRun ? '[DRY RUN] ' : ''}Workflow execution ${result.status}`
      );
      console.log(`Duration: ${result.duration}ms`);
      console.log(
        `Steps completed: ${result.step_results.filter(s => s.status === 'completed').length}/${result.step_results.length}\n`
      );

      // Show step details
      for (const stepResult of result.step_results) {
        const icon =
          stepResult.status === 'completed'
            ? '✅'
            : stepResult.status === 'failed'
              ? '❌'
              : stepResult.status === 'skipped'
                ? '⏭️'
                : '⏸️';

        console.log(
          `${icon} ${stepResult.step_name} (${stepResult.duration || 0}ms)`
        );

        if (stepResult.stdout && stepResult.stdout.trim()) {
          console.log(
            `   Output: ${stepResult.stdout.substring(0, 200)}${stepResult.stdout.length > 200 ? '...' : ''}`
          );
        }

        if (stepResult.error) {
          console.log(`   Error: ${stepResult.error.message}`);
        }
      }

      if (result.status === 'failed') {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error executing workflow:', error);
      process.exit(1);
    }
  });

// Validate workflow command
program
  .command('validate <file>')
  .description('Validate a workflow file')
  .action(async file => {
    try {
      const fs = await import('fs');
      const YAML = await import('yaml');

      if (!fs.existsSync(file)) {
        console.error(`❌ File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      let workflowData;

      try {
        workflowData = YAML.parse(content);
      } catch (error) {
        console.error('❌ Invalid YAML format:', error);
        process.exit(1);
      }

      const { validateWorkflow } = await import('../workflow/schemas.js');
      const validation = validateWorkflow(workflowData);

      if (validation.success) {
        const workflow = validation.data;
        console.log('✅ Workflow validation passed!\n');
        console.log(`Name: ${workflow.name}`);
        console.log(`Description: ${workflow.description}`);
        console.log(`Version: ${workflow.version}`);
        console.log(`Scope: ${workflow.scope}`);
        console.log(`Steps: ${workflow.steps.length}`);
      } else {
        console.log('❌ Workflow validation failed:\n');
        if (validation.errors) {
          for (const error of validation.errors) {
            console.log(`• ${error}`);
          }
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error validating workflow:', error);
      process.exit(1);
    }
  });

// Start MCP server command
program
  .command('server')
  .description('Start the MCP server')
  .action(async () => {
    try {
      const { main } = await import('../index.js');
      await main();
    } catch (error) {
      console.error('❌ Error starting MCP server:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
