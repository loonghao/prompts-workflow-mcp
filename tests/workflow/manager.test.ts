/**
 * Workflow Manager Unit Tests
 *
 * Basic tests for workflow management functionality.
 */

import { WorkflowManager } from '../../src/workflow/manager';
import { GlobalConfig } from '../../src/workflow/types';

describe('WorkflowManager', () => {
  let manager: WorkflowManager;
  const mockGlobalConfig: GlobalConfig = {
    templates_path: '/test/templates',
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

  beforeEach(() => {
    manager = new WorkflowManager(mockGlobalConfig, '/test/project');
  });

  describe('constructor', () => {
    test('should create WorkflowManager instance', () => {
      expect(manager).toBeInstanceOf(WorkflowManager);
    });
  });

  describe('listWorkflows', () => {
    test('should return empty array when no workflows exist', async () => {
      const workflows = await manager.listWorkflows();
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBe(0);
    });

    test('should handle different scopes', async () => {
      const globalWorkflows = await manager.listWorkflows('global');
      const projectWorkflows = await manager.listWorkflows('project');
      const allWorkflows = await manager.listWorkflows('all');

      expect(Array.isArray(globalWorkflows)).toBe(true);
      expect(Array.isArray(projectWorkflows)).toBe(true);
      expect(Array.isArray(allWorkflows)).toBe(true);
    });
  });

  describe('getWorkflow', () => {
    test('should return null for non-existent workflow', async () => {
      const workflow = await manager.getWorkflow('non-existent');
      expect(workflow).toBeNull();
    });
  });

  describe('createWorkflow', () => {
    test('should handle workflow creation', async () => {
      const content = '# Test Workflow\n\nA simple test workflow.';
      const result = await manager.createWorkflow('test-workflow', content);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('updateWorkflow', () => {
    test('should handle workflow update for non-existent workflow', async () => {
      const content = '# Updated Workflow\n\nAn updated workflow.';
      const result = await manager.updateWorkflow('non-existent', content);
      expect(result).toBe(false);
    });
  });

  describe('deleteWorkflow', () => {
    test('should handle workflow deletion', async () => {
      const result = await manager.deleteWorkflow('test-workflow');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getSuggestedWorkflows', () => {
    test('should return array of suggested workflows', async () => {
      const suggestions = await manager.getSuggestedWorkflows();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});
