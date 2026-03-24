/**
 * Project Type Detection
 *
 * Automatically detects project type based on files and patterns.
 * Supports JavaScript, Python, Rust, Go, and custom project types.
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  ProjectDetectionConfig,
  ProjectTypeConfig,
} from '../workflow/types.js';
import { Logger } from './logger.js';

export interface ProjectDetectionResult {
  type: string;
  confidence: number;
  detected_files: string[];
  suggested_workflows: string[];
}

export class ProjectDetector {
  private logger: Logger;
  private config: ProjectDetectionConfig;

  constructor(config: ProjectDetectionConfig) {
    this.logger = new Logger('ProjectDetector');
    this.config = config;
  }

  /**
   * Detect project type for a given directory
   */
  detectProjectType(projectPath: string): ProjectDetectionResult | null {
    try {
      if (!existsSync(projectPath) || !statSync(projectPath).isDirectory()) {
        this.logger.warn(`Invalid project path: ${projectPath}`);
        return null;
      }

      const results: ProjectDetectionResult[] = [];

      // Check each configured project type
      for (const [typeName, typeConfig] of Object.entries(this.config)) {
        if (typeName === 'custom') continue;

        const result = this.checkProjectType(projectPath, typeName, typeConfig);
        if (result.confidence > 0) {
          results.push(result);
        }
      }

      // Check custom project types
      if (this.config.custom) {
        for (const [typeName, typeConfig] of Object.entries(
          this.config.custom
        )) {
          const result = this.checkProjectType(
            projectPath,
            typeName,
            typeConfig
          );
          if (result.confidence > 0) {
            results.push(result);
          }
        }
      }

      // Return the highest confidence result
      if (results.length === 0) {
        this.logger.info(`No project type detected for: ${projectPath}`);
        return null;
      }

      results.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = results[0];

      if (bestMatch) {
        this.logger.info(
          `Detected project type: ${bestMatch.type} (confidence: ${bestMatch.confidence})`
        );
        return bestMatch;
      }

      return null;
    } catch (error) {
      this.logger.error('Error detecting project type:', error);
      return null;
    }
  }

  /**
   * Check if a directory matches a specific project type
   */
  private checkProjectType(
    projectPath: string,
    typeName: string,
    typeConfig: ProjectTypeConfig
  ): ProjectDetectionResult {
    let confidence = 0;
    const detectedFiles: string[] = [];

    // Check for required files
    for (const fileName of typeConfig.files) {
      const filePath = join(projectPath, fileName);
      if (existsSync(filePath)) {
        detectedFiles.push(fileName);
        confidence += 30; // Each required file adds 30% confidence
      }
    }

    // Check for file patterns
    if (typeConfig.patterns && typeConfig.patterns.length > 0) {
      const files = this.getProjectFiles(projectPath);
      const matchingPatterns = this.countMatchingPatterns(
        files,
        typeConfig.patterns
      );

      if (matchingPatterns > 0) {
        confidence += Math.min(matchingPatterns * 5, 40); // Up to 40% from patterns
      }
    }

    return {
      type: typeName,
      confidence: Math.min(confidence, 100),
      detected_files: detectedFiles,
      suggested_workflows: typeConfig.default_workflows || [],
    };
  }

  /**
   * Get all files in a project directory (non-recursive for performance)
   */
  private getProjectFiles(projectPath: string): string[] {
    try {
      return readdirSync(projectPath).filter(file => {
        const filePath = join(projectPath, file);
        return statSync(filePath).isFile();
      });
    } catch (error) {
      this.logger.warn(`Failed to read directory: ${projectPath}`, error);
      return [];
    }
  }

  /**
   * Count files matching the given patterns
   */
  private countMatchingPatterns(files: string[], patterns: string[]): number {
    let count = 0;

    for (const file of files) {
      for (const pattern of patterns) {
        if (this.matchesPattern(file, pattern)) {
          count++;
          break; // Don't count the same file multiple times
        }
      }
    }

    return count;
  }

  /**
   * Check if a file matches a pattern (simple glob-like matching)
   */
  private matchesPattern(fileName: string, pattern: string): boolean {
    // Convert simple glob pattern to regex
    if (pattern.startsWith('*.')) {
      const extension = pattern.substring(1);
      return fileName.endsWith(extension);
    }

    // Exact match
    if (pattern === fileName) {
      return true;
    }

    // More complex patterns could be added here
    return false;
  }

  /**
   * Get suggested workflows for a project type
   */
  getSuggestedWorkflows(projectType: string): string[] {
    // Check built-in project types
    if (projectType === 'javascript' && this.config.javascript) {
      return this.config.javascript.default_workflows || [];
    }
    if (projectType === 'python' && this.config.python) {
      return this.config.python.default_workflows || [];
    }
    if (projectType === 'rust' && this.config.rust) {
      return this.config.rust.default_workflows || [];
    }
    if (projectType === 'go' && this.config.go) {
      return this.config.go.default_workflows || [];
    }

    // Check custom configurations
    const customConfig = this.config.custom?.[projectType];
    if (customConfig && 'default_workflows' in customConfig) {
      return customConfig.default_workflows || [];
    }

    return [];
  }

  /**
   * Check if a project has specific capabilities
   */
  hasCapability(projectPath: string, capability: string): boolean {
    const detection = this.detectProjectType(projectPath);
    if (!detection) return false;

    switch (capability) {
      case 'testing':
        return this.hasTestingCapability(projectPath, detection.type);
      case 'linting':
        return this.hasLintingCapability(projectPath, detection.type);
      case 'building':
        return this.hasBuildingCapability(projectPath, detection.type);
      default:
        return false;
    }
  }

  private hasTestingCapability(
    projectPath: string,
    projectType: string
  ): boolean {
    switch (projectType) {
      case 'javascript':
        return existsSync(join(projectPath, 'package.json'));
      case 'python':
        return (
          existsSync(join(projectPath, 'pyproject.toml')) ||
          existsSync(join(projectPath, 'pytest.ini')) ||
          existsSync(join(projectPath, 'tests'))
        );
      case 'rust':
        return existsSync(join(projectPath, 'Cargo.toml'));
      case 'go':
        return existsSync(join(projectPath, 'go.mod'));
      default:
        return false;
    }
  }

  private hasLintingCapability(
    projectPath: string,
    projectType: string
  ): boolean {
    switch (projectType) {
      case 'javascript':
        return (
          existsSync(join(projectPath, '.eslintrc.js')) ||
          existsSync(join(projectPath, '.eslintrc.json')) ||
          existsSync(join(projectPath, 'eslint.config.js'))
        );
      case 'python':
        return (
          existsSync(join(projectPath, 'pyproject.toml')) ||
          existsSync(join(projectPath, '.ruff.toml'))
        );
      case 'rust':
        return true; // Rust has built-in clippy
      case 'go':
        return true; // Go has built-in linting
      default:
        return false;
    }
  }

  private hasBuildingCapability(
    projectPath: string,
    projectType: string
  ): boolean {
    switch (projectType) {
      case 'javascript':
        return existsSync(join(projectPath, 'package.json'));
      case 'python':
        return (
          existsSync(join(projectPath, 'pyproject.toml')) ||
          existsSync(join(projectPath, 'setup.py'))
        );
      case 'rust':
        return existsSync(join(projectPath, 'Cargo.toml'));
      case 'go':
        return existsSync(join(projectPath, 'go.mod'));
      default:
        return false;
    }
  }
}
