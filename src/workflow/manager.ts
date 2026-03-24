/**
 * Workflow Manager
 *
 * Manages workflow definitions, loading, validation, and CRUD operations.
 * Handles both global and project-specific workflows with inheritance.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

import YAML from 'yaml';

import { Workflow, WorkflowScope, GlobalConfig } from './types.js';
import { validateWorkflow } from './schemas.js';
import { Logger } from '../utils/logger.js';
import { ProjectDetector } from '../utils/project-detector.js';

export interface WorkflowListItem {
  name: string;
  description: string;
  scope: WorkflowScope;
  version: string;
  tags?: string[];
  file_path: string;
}

export class WorkflowManager {
  private logger: Logger;
  private globalConfig: GlobalConfig;
  // private _projectConfig: ProjectConfig | null;
  private projectDetector: ProjectDetector;
  private projectRoot: string;

  constructor(
    globalConfig: GlobalConfig,
    // _projectConfig: ProjectConfig | null = null,
    projectRoot: string = process.cwd()
  ) {
    this.logger = new Logger('WorkflowManager');
    this.globalConfig = globalConfig;
    // this._projectConfig = projectConfig;
    this.projectRoot = projectRoot;
    this.projectDetector = new ProjectDetector(globalConfig.project_detection);
  }

  /**
   * List all available workflows
   */
  async listWorkflows(
    scope: 'global' | 'project' | 'all' = 'all'
  ): Promise<WorkflowListItem[]> {
    const workflows: WorkflowListItem[] = [];

    try {
      if (scope === 'global' || scope === 'all') {
        const globalWorkflows = await this.loadGlobalWorkflows();
        workflows.push(...globalWorkflows);
      }

      if (scope === 'project' || scope === 'all') {
        const projectWorkflows = await this.loadProjectWorkflows();
        workflows.push(...projectWorkflows);
      }

      this.logger.info(
        `Listed ${workflows.length} workflows (scope: ${scope})`
      );
      return workflows;
    } catch (error) {
      this.logger.error('Failed to list workflows:', error);
      return [];
    }
  }

  /**
   * Get a specific workflow by name
   */
  async getWorkflow(
    name: string,
    scope?: WorkflowScope
  ): Promise<Workflow | null> {
    try {
      // Try project scope first if not specified
      if (!scope || scope === 'project') {
        const projectWorkflow = await this.loadProjectWorkflow(name);
        if (projectWorkflow) {
          return projectWorkflow;
        }
      }

      // Try global scope
      if (!scope || scope === 'global') {
        const globalWorkflow = await this.loadGlobalWorkflow(name);
        if (globalWorkflow) {
          return globalWorkflow;
        }
      }

      this.logger.warn(`Workflow not found: ${name}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get workflow: ${name}`, error);
      return null;
    }
  }

  /**
   * Create a new workflow from Markdown content
   */
  async createWorkflow(
    name: string,
    content: string,
    scope: WorkflowScope = 'project'
  ): Promise<boolean> {
    try {
      // Parse Markdown content to extract workflow definition
      const workflow = await this.parseMarkdownWorkflow(name, content, scope);

      // Validate workflow
      const validation = validateWorkflow(workflow);
      if (!validation.success) {
        this.logger.error('Invalid workflow definition:', validation.errors);
        return false;
      }

      // Save workflow
      const success = await this.saveWorkflow(workflow, scope);
      if (success) {
        this.logger.info(`Created workflow: ${name} (${scope})`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to create workflow: ${name}`, error);
      return false;
    }
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(
    name: string,
    content: string,
    scope?: WorkflowScope
  ): Promise<boolean> {
    try {
      // Find existing workflow
      const existing = await this.getWorkflow(name, scope);
      if (!existing) {
        this.logger.error(`Workflow not found for update: ${name}`);
        return false;
      }

      // Parse new content
      const workflow = await this.parseMarkdownWorkflow(
        name,
        content,
        existing.scope
      );

      // Validate workflow
      const validation = validateWorkflow(workflow);
      if (!validation.success) {
        this.logger.error('Invalid workflow definition:', validation.errors);
        return false;
      }

      // Save updated workflow
      const success = await this.saveWorkflow(workflow, existing.scope);
      if (success) {
        this.logger.info(`Updated workflow: ${name} (${existing.scope})`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to update workflow: ${name}`, error);
      return false;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(name: string, scope?: WorkflowScope): Promise<boolean> {
    try {
      const filePath = this.getWorkflowPath(name, scope || 'project');

      if (!existsSync(filePath)) {
        this.logger.error(`Workflow file not found: ${filePath}`);
        return false;
      }

      // For now, we'll just log that we would delete it
      // In a real implementation, you might want to move to trash or backup
      this.logger.info(`Would delete workflow: ${name} at ${filePath}`);

      // TODO: Implement actual deletion with safety checks
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete workflow: ${name}`, error);
      return false;
    }
  }

  /**
   * Get suggested workflows for current project
   */
  async getSuggestedWorkflows(): Promise<string[]> {
    try {
      const detection = this.projectDetector.detectProjectType(
        this.projectRoot
      );
      if (!detection) {
        return [];
      }

      return detection.suggested_workflows;
    } catch (error) {
      this.logger.error('Failed to get suggested workflows:', error);
      return [];
    }
  }

  /**
   * Load global workflows
   */
  private async loadGlobalWorkflows(): Promise<WorkflowListItem[]> {
    const workflows: WorkflowListItem[] = [];
    const templatesPath = this.globalConfig.templates_path;

    if (!existsSync(templatesPath)) {
      return workflows;
    }

    // TODO: Implement recursive directory scanning for workflow files
    // For now, return empty array as placeholder
    return workflows;
  }

  /**
   * Load project workflows
   */
  private async loadProjectWorkflows(): Promise<WorkflowListItem[]> {
    const workflows: WorkflowListItem[] = [];
    const projectWorkflowsPath = join(
      this.projectRoot,
      '.prompts-workflow',
      'workflows'
    );

    if (!existsSync(projectWorkflowsPath)) {
      return workflows;
    }

    // TODO: Implement directory scanning for workflow files
    // For now, return empty array as placeholder
    return workflows;
  }

  /**
   * Load a specific global workflow
   */
  private async loadGlobalWorkflow(name: string): Promise<Workflow | null> {
    const filePath = this.getWorkflowPath(name, 'global');
    return this.loadWorkflowFromFile(filePath);
  }

  /**
   * Load a specific project workflow
   */
  private async loadProjectWorkflow(name: string): Promise<Workflow | null> {
    const filePath = this.getWorkflowPath(name, 'project');
    return this.loadWorkflowFromFile(filePath);
  }

  /**
   * Load workflow from file
   */
  private async loadWorkflowFromFile(
    filePath: string
  ): Promise<Workflow | null> {
    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const content = readFileSync(filePath, 'utf-8');

      if (filePath.endsWith('.md')) {
        // Parse Markdown workflow
        const name = filePath.split('/').pop()?.replace('.md', '') || 'unknown';
        const scope = filePath.includes('.prompts-workflow')
          ? 'project'
          : 'global';
        return this.parseMarkdownWorkflow(name, content, scope);
      } else {
        // Parse YAML workflow
        const data = YAML.parse(content);
        const validation = validateWorkflow(data);
        return validation.success ? validation.data : null;
      }
    } catch (error) {
      this.logger.error(`Failed to load workflow from: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Parse Markdown content to extract workflow definition
   */
  private async parseMarkdownWorkflow(
    name: string,
    _content: string,
    scope: WorkflowScope
  ): Promise<Workflow> {
    // This is a simplified parser - in a real implementation,
    // you'd want more sophisticated Markdown parsing
    const description = 'Workflow created from Markdown';
    const version = '1.0.0';

    // Create basic workflow structure
    const workflow: Workflow = {
      name,
      description,
      version,
      scope,
      steps: [
        {
          name: 'placeholder',
          type: 'command',
          command: 'echo "This is a placeholder workflow"',
        },
      ],
    };

    return workflow;
  }

  /**
   * Save workflow to file
   */
  private async saveWorkflow(
    workflow: Workflow,
    scope: WorkflowScope
  ): Promise<boolean> {
    try {
      const filePath = this.getWorkflowPath(workflow.name, scope);
      const dir = dirname(filePath);

      // Ensure directory exists
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Convert to YAML and save
      const yamlContent = YAML.stringify(workflow, { indent: 2 });
      writeFileSync(filePath, yamlContent, 'utf-8');

      return true;
    } catch (error) {
      this.logger.error('Failed to save workflow:', error);
      return false;
    }
  }

  /**
   * Get the file path for a workflow
   */
  private getWorkflowPath(name: string, scope: WorkflowScope): string {
    if (scope === 'global') {
      return join(this.globalConfig.templates_path, `${name}.yaml`);
    } else {
      return join(
        this.projectRoot,
        '.prompts-workflow',
        'workflows',
        `${name}.yaml`
      );
    }
  }
}
