/**
 * Workflow Validation Schemas
 *
 * This module provides Zod schemas for runtime validation of workflow
 * definitions and configurations. Following Node.js MCP best practices
 * for type-safe validation and error handling.
 */

import { z } from 'zod';

// ============================================================================
// Basic Type Schemas
// ============================================================================

/**
 * Workflow scope schema
 */
export const WorkflowScopeSchema = z.enum(['global', 'project']);

/**
 * Workflow step type schema
 */
export const WorkflowStepTypeSchema = z.enum([
  'command',
  'action',
  'condition',
  'parallel',
  'sequential',
]);

/**
 * Workflow status schema
 */
export const WorkflowStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

/**
 * Step status schema
 */
export const StepStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
  'cancelled',
]);

// ============================================================================
// Core Workflow Schemas
// ============================================================================

/**
 * Retry configuration schema
 */
export const RetryConfigSchema = z.object({
  max_attempts: z.number().int().min(1).max(10),
  delay: z.number().int().min(0),
  backoff: z.enum(['linear', 'exponential']).optional(),
  max_delay: z.number().int().min(0).optional(),
  retry_on: z.array(z.string()).optional(),
});

/**
 * Workflow parameter schema
 */
export const WorkflowParameterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean(),
  default: z.unknown().optional(),
  validation: z.any().optional(), // ZodSchema
  enum: z.array(z.unknown()).optional(),
});

/**
 * Workflow metadata schema
 */
export const WorkflowMetadataSchema = z.object({
  author: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  documentation: z.string().url().optional(),
  license: z.string().optional(),
  min_version: z.string().optional(),
  category: z.string().optional(),
  custom: z.record(z.unknown()).optional(),
});

/**
 * Workflow step schema
 */
export const WorkflowStepSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    name: z.string().min(1),
    type: WorkflowStepTypeSchema,
    command: z.string().optional(),
    action: z.string().optional(),
    parameters: z.record(z.unknown()).optional(),
    continue_on_error: z.boolean().optional(),
    timeout: z.number().int().min(0).optional(),
    condition: z.string().optional(),
    working_directory: z.string().optional(),
    environment: z.record(z.string()).optional(),
    parallel_steps: z.array(WorkflowStepSchema).optional(),
    sequential_steps: z.array(WorkflowStepSchema).optional(),
    depends_on: z.array(z.string()).optional(),
    retry: RetryConfigSchema.optional(),
  })
);

/**
 * Main workflow schema
 */
export const WorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  scope: WorkflowScopeSchema,
  tags: z.array(z.string()).optional(),
  steps: z.array(WorkflowStepSchema).min(1),
  rollback: z.array(WorkflowStepSchema).optional(),
  timeout: z.number().int().min(0).optional(),
  retry: RetryConfigSchema.optional(),
  environment: z.record(z.string()).optional(),
  parameters: z.array(WorkflowParameterSchema).optional(),
  metadata: WorkflowMetadataSchema.optional(),
});

// ============================================================================
// Configuration Schemas
// ============================================================================

/**
 * Logging configuration schema
 */
export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  format: z.enum(['json', 'text']),
  outputs: z.array(z.string()),
  file_logging: z.boolean(),
  log_file: z.string().optional(),
});

/**
 * GitHub configuration schema
 */
export const GitHubConfigSchema = z.object({
  auto_clean_augment_descriptions: z.boolean(),
  default_branch: z.string(),
  token: z.string().optional(),
  repository: z
    .object({
      owner: z.string(),
      name: z.string(),
    })
    .optional(),
});

/**
 * Docker configuration schema
 */
export const DockerConfigSchema = z.object({
  default_image: z.string().optional(),
  registry: z
    .object({
      url: z.string().url(),
      username: z.string().optional(),
      password: z.string().optional(),
    })
    .optional(),
});

/**
 * Integration configuration schema
 */
export const IntegrationConfigSchema = z.object({
  github: GitHubConfigSchema.optional(),
  docker: DockerConfigSchema.optional(),
  custom: z.record(z.unknown()).optional(),
});

/**
 * Project type configuration schema
 */
export const ProjectTypeConfigSchema = z.object({
  files: z.array(z.string()),
  patterns: z.array(z.string()).optional(),
  default_workflows: z.array(z.string()).optional(),
});

/**
 * Project detection configuration schema
 */
export const ProjectDetectionConfigSchema = z.object({
  javascript: ProjectTypeConfigSchema,
  python: ProjectTypeConfigSchema,
  rust: ProjectTypeConfigSchema,
  go: ProjectTypeConfigSchema,
  custom: z.record(ProjectTypeConfigSchema).optional(),
});

/**
 * Security configuration schema
 */
export const SecurityConfigSchema = z.object({
  allowed_commands: z.array(z.string()).optional(),
  blocked_commands: z.array(z.string()).optional(),
  sandbox_mode: z.boolean(),
  max_execution_time: z.number().int().min(0),
  env_restrictions: z
    .object({
      allowed_vars: z.array(z.string()).optional(),
      blocked_vars: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Global configuration schema
 */
export const GlobalConfigSchema = z.object({
  templates_path: z.string(),
  default_timeout: z.number().int().min(0),
  auto_cleanup: z.boolean(),
  logging: LoggingConfigSchema,
  integrations: IntegrationConfigSchema,
  project_detection: ProjectDetectionConfigSchema,
  security: SecurityConfigSchema,
});

/**
 * Workflow configuration schema
 */
export const WorkflowConfigSchema = z.object({
  extends: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
  steps: z.array(WorkflowStepSchema).optional(),
  environment: z.record(z.string()).optional(),
  timeout: z.number().int().min(0).optional(),
});

/**
 * Project configuration schema
 */
export const ProjectConfigSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  workflows: z.record(WorkflowConfigSchema),
  environment: z.record(z.string()),
  integrations: IntegrationConfigSchema.partial().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Execution Schemas
// ============================================================================

/**
 * Execution context schema
 */
export const ExecutionContextSchema = z.object({
  execution_id: z.string().uuid(),
  workflow: WorkflowSchema,
  parameters: z.record(z.unknown()),
  environment: z.record(z.string()),
  working_directory: z.string(),
  start_time: z.date(),
  current_step_index: z.number().int().min(0),
  status: WorkflowStatusSchema,
  dry_run: z.boolean(),
  user: z
    .object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  session: z
    .object({
      id: z.string(),
      client_info: z.record(z.unknown()).optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Step result schema
 */
export const StepResultSchema = z.object({
  step_name: z.string(),
  step_index: z.number().int().min(0),
  status: StepStatusSchema,
  start_time: z.date(),
  end_time: z.date().optional(),
  duration: z.number().int().min(0).optional(),
  output: z.unknown().optional(),
  error: z.any().optional(), // WorkflowError
  exit_code: z.number().int().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  retry_attempts: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Log entry schema
 */
export const LogEntrySchema = z.object({
  timestamp: z.date(),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  source: z.string(),
  data: z.record(z.unknown()).optional(),
  execution_id: z.string().optional(),
  step_name: z.string().optional(),
});

/**
 * Resource usage schema
 */
export const ResourceUsageSchema = z.object({
  cpu_usage: z.number().min(0).max(100).optional(),
  memory_usage: z.number().int().min(0).optional(),
  disk_io: z
    .object({
      read_bytes: z.number().int().min(0),
      write_bytes: z.number().int().min(0),
    })
    .optional(),
  network_io: z
    .object({
      bytes_sent: z.number().int().min(0),
      bytes_received: z.number().int().min(0),
    })
    .optional(),
  time_breakdown: z
    .object({
      setup_time: z.number().int().min(0),
      execution_time: z.number().int().min(0),
      cleanup_time: z.number().int().min(0),
    })
    .optional(),
});

/**
 * Execution result schema
 */
export const ExecutionResultSchema = z.object({
  execution_id: z.string().uuid(),
  workflow_name: z.string(),
  status: WorkflowStatusSchema,
  start_time: z.date(),
  end_time: z.date().optional(),
  duration: z.number().int().min(0).optional(),
  step_results: z.array(StepResultSchema),
  output: z.unknown().optional(),
  error: z.any().optional(), // WorkflowError
  logs: z.array(LogEntrySchema),
  resource_usage: ResourceUsageSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate a workflow definition
 */
export function validateWorkflow(data: unknown): {
  success: boolean;
  data?: any;
  errors?: string[];
} {
  try {
    const result = WorkflowSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Validate a project configuration
 */
export function validateProjectConfig(data: unknown): {
  success: boolean;
  data?: any;
  errors?: string[];
} {
  try {
    const result = ProjectConfigSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Validate a global configuration
 */
export function validateGlobalConfig(data: unknown): {
  success: boolean;
  data?: any;
  errors?: string[];
} {
  try {
    const result = GlobalConfigSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error'],
    };
  }
}
