/**
 * Workflow Manager Unit Tests
 * 
 * Tests for workflow CRUD operations and management functionality.
 */

import { WorkflowManager } from '../../src/workflow/manager';
import { Workflow } from '../../src/workflow/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('WorkflowManager', () => {
  let manager: WorkflowManager;
  const testWorkflowsPath = '/test/workflows';

  beforeEach(() => {
    manager = new WorkflowManager(testWorkflowsPath);
    jest.clearAllMocks();
  });

  describe('createWorkflow', () => {
    test('should create a new workflow successfully', async () => {
      const workflow: Workflow = {
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

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await manager.createWorkflow(workflow);

      expect(mockFs.mkdir).toHaveBeenCalledWith(testWorkflowsPath, { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testWorkflowsPath, 'test-workflow.yaml'),
        expect.stringContaining('name: test-workflow'),
        'utf8'
      );
    });

    test('should throw error if workflow already exists', async () => {
      const workflow: Workflow = {
        name: 'existing-workflow',
        description: 'An existing workflow',
        version: '1.0.0',
        scope: 'project',
        steps: [],
      };

      mockFs.access.mockResolvedValue(undefined); // File exists

      await expect(manager.createWorkflow(workflow)).rejects.toThrow(
        'Workflow "existing-workflow" already exists'
      );
    });
  });

  describe('readWorkflow', () => {
    test('should read an existing workflow', async () => {
      const workflowYaml = `
name: test-workflow
description: A test workflow
version: 1.0.0
scope: project
steps:
  - name: test-step
    type: command
    command: echo "hello"
`;

      mockFs.readFile.mockResolvedValue(workflowYaml);

      const workflow = await manager.readWorkflow('test-workflow');

      expect(workflow.name).toBe('test-workflow');
      expect(workflow.description).toBe('A test workflow');
      expect(workflow.steps).toHaveLength(1);
      expect(workflow.steps[0]?.name).toBe('test-step');
    });

    test('should throw error if workflow does not exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(manager.readWorkflow('nonexistent')).rejects.toThrow(
        'Workflow "nonexistent" not found'
      );
    });
  });

  describe('updateWorkflow', () => {
    test('should update an existing workflow', async () => {
      const updatedWorkflow: Workflow = {
        name: 'test-workflow',
        description: 'Updated test workflow',
        version: '1.1.0',
        scope: 'project',
        steps: [
          {
            name: 'updated-step',
            type: 'command',
            command: 'echo "updated"',
          },
        ],
      };

      mockFs.access.mockResolvedValue(undefined); // File exists
      mockFs.writeFile.mockResolvedValue(undefined);

      await manager.updateWorkflow('test-workflow', updatedWorkflow);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testWorkflowsPath, 'test-workflow.yaml'),
        expect.stringContaining('description: Updated test workflow'),
        'utf8'
      );
    });

    test('should throw error if workflow does not exist', async () => {
      const workflow: Workflow = {
        name: 'nonexistent',
        description: 'Test',
        version: '1.0.0',
        scope: 'project',
        steps: [],
      };

      mockFs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(manager.updateWorkflow('nonexistent', workflow)).rejects.toThrow(
        'Workflow "nonexistent" not found'
      );
    });
  });

  describe('deleteWorkflow', () => {
    test('should delete an existing workflow', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      await manager.deleteWorkflow('test-workflow');

      expect(mockFs.unlink).toHaveBeenCalledWith(
        path.join(testWorkflowsPath, 'test-workflow.yaml')
      );
    });

    test('should throw error if workflow does not exist', async () => {
      mockFs.unlink.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(manager.deleteWorkflow('nonexistent')).rejects.toThrow(
        'Workflow "nonexistent" not found'
      );
    });
  });

  describe('listWorkflows', () => {
    test('should list all workflows', async () => {
      mockFs.readdir.mockResolvedValue(['workflow1.yaml', 'workflow2.yaml', 'not-yaml.txt'] as any);

      const workflows = await manager.listWorkflows();

      expect(workflows).toEqual(['workflow1', 'workflow2']);
      expect(mockFs.readdir).toHaveBeenCalledWith(testWorkflowsPath);
    });

    test('should return empty array if directory does not exist', async () => {
      mockFs.readdir.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const workflows = await manager.listWorkflows();

      expect(workflows).toEqual([]);
    });
  });

  describe('workflowExists', () => {
    test('should return true if workflow exists', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const exists = await manager.workflowExists('test-workflow');

      expect(exists).toBe(true);
    });

    test('should return false if workflow does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const exists = await manager.workflowExists('nonexistent');

      expect(exists).toBe(false);
    });
  });

  describe('validateWorkflowName', () => {
    test('should accept valid workflow names', () => {
      expect(() => manager.validateWorkflowName('valid-name')).not.toThrow();
      expect(() => manager.validateWorkflowName('valid_name')).not.toThrow();
      expect(() => manager.validateWorkflowName('validname123')).not.toThrow();
    });

    test('should reject invalid workflow names', () => {
      expect(() => manager.validateWorkflowName('')).toThrow('Workflow name cannot be empty');
      expect(() => manager.validateWorkflowName('invalid name')).toThrow('Invalid workflow name');
      expect(() => manager.validateWorkflowName('invalid/name')).toThrow('Invalid workflow name');
      expect(() => manager.validateWorkflowName('invalid.name')).toThrow('Invalid workflow name');
    });
  });
});
