/**
 * Configuration Loader
 *
 * Handles loading and merging of global and project-specific configurations.
 * Supports YAML and JSON formats with hierarchical configuration merging.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import YAML from 'yaml';
import { GlobalConfig, ProjectConfig } from '../workflow/types.js';
import {
  validateGlobalConfig,
  validateProjectConfig,
} from '../workflow/schemas.js';
import { Logger } from '../utils/logger.js';

export class ConfigLoader {
  private logger: Logger;
  private globalConfigPath: string;
  private projectConfigPath: string;

  constructor(projectRoot?: string) {
    this.logger = new Logger('ConfigLoader');
    this.globalConfigPath = join(homedir(), '.prompts-workflow', 'config.yaml');
    this.projectConfigPath = projectRoot
      ? join(projectRoot, '.prompts-workflow', 'config.yaml')
      : join(process.cwd(), '.prompts-workflow', 'config.yaml');
  }

  /**
   * Load global configuration
   */
  async loadGlobalConfig(): Promise<GlobalConfig | null> {
    try {
      if (!existsSync(this.globalConfigPath)) {
        this.logger.info('Global config not found, using defaults');
        return this.getDefaultGlobalConfig();
      }

      const content = readFileSync(this.globalConfigPath, 'utf-8');
      const config = this.parseConfig(content);

      const validation = validateGlobalConfig(config);
      if (!validation.success) {
        this.logger.error('Invalid global config:', validation.errors);
        return null;
      }

      this.logger.info('Global config loaded successfully');
      return validation.data as GlobalConfig;
    } catch (error) {
      this.logger.error('Failed to load global config:', error);
      return null;
    }
  }

  /**
   * Load project configuration
   */
  async loadProjectConfig(): Promise<ProjectConfig | null> {
    try {
      if (!existsSync(this.projectConfigPath)) {
        this.logger.info('Project config not found');
        return null;
      }

      const content = readFileSync(this.projectConfigPath, 'utf-8');
      const config = this.parseConfig(content);

      const validation = validateProjectConfig(config);
      if (!validation.success) {
        this.logger.error('Invalid project config:', validation.errors);
        return null;
      }

      this.logger.info('Project config loaded successfully');
      return validation.data as ProjectConfig;
    } catch (error) {
      this.logger.error('Failed to load project config:', error);
      return null;
    }
  }

  /**
   * Parse configuration content (YAML or JSON)
   */
  private parseConfig(content: string): unknown {
    try {
      // Try YAML first
      return YAML.parse(content);
    } catch {
      try {
        // Fallback to JSON
        return JSON.parse(content);
      } catch (error) {
        throw new Error(`Failed to parse config as YAML or JSON: ${error}`);
      }
    }
  }

  /**
   * Get default global configuration
   */
  private getDefaultGlobalConfig(): GlobalConfig {
    return {
      templates_path: join(homedir(), '.prompts-workflow', 'templates'),
      default_timeout: 300000, // 5 minutes
      auto_cleanup: true,
      logging: {
        level: 'info',
        format: 'text',
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
          files: ['package.json', 'yarn.lock', 'pnpm-lock.yaml'],
          patterns: ['*.js', '*.ts', '*.jsx', '*.tsx'],
          default_workflows: ['create-pr', 'run-tests'],
        },
        python: {
          files: ['pyproject.toml', 'requirements.txt', 'setup.py'],
          patterns: ['*.py'],
          default_workflows: ['create-pr', 'run-tests'],
        },
        rust: {
          files: ['Cargo.toml'],
          patterns: ['*.rs'],
          default_workflows: ['create-pr', 'run-tests'],
        },
        go: {
          files: ['go.mod'],
          patterns: ['*.go'],
          default_workflows: ['create-pr', 'run-tests'],
        },
      },
      security: {
        sandbox_mode: true,
        max_execution_time: 3600000, // 1 hour
        allowed_commands: [
          'npm',
          'yarn',
          'pnpm',
          'node',
          'python',
          'pip',
          'cargo',
          'go',
          'git',
        ],
        blocked_commands: ['rm', 'del', 'format', 'fdisk'],
      },
    };
  }
}
