/**
 * Workflow Data Models and Type Definitions
 *
 * This module defines the core TypeScript interfaces and types for the
 * prompts-workflow-mcp system. All types are designed with extensibility
 * and type safety in mind, following Node.js MCP development best practices.
 */

import { z } from 'zod';

// ============================================================================
// Core Workflow Types
// ============================================================================

/**
 * Workflow scope determines where the workflow is stored and accessible
 */
export type WorkflowScope = 'global' | 'project';

/**
 * Workflow step types define the kind of operation to perform
 */
export type WorkflowStepType =
  | 'command'
  | 'action'
  | 'condition'
  | 'parallel'
  | 'sequential';

/**
 * Workflow execution status
 */
export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Step execution status
 */
export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled';

// ============================================================================
// Workflow Definition Interfaces
// ============================================================================

/**
 * Core workflow definition interface
 * Represents a complete workflow with metadata and execution steps
 */
export interface Workflow {
  /** Unique workflow identifier */
  name: string;

  /** Human-readable description */
  description: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Workflow scope (global or project) */
  scope: WorkflowScope;

  /** Optional tags for categorization */
  tags?: string[];

  /** Workflow execution steps */
  steps: WorkflowStep[];

  /** Optional rollback steps for error recovery */
  rollback?: WorkflowStep[];

  /** Global timeout in milliseconds */
  timeout?: number;

  /** Retry configuration */
  retry?: RetryConfig;

  /** Environment variables for the workflow */
  environment?: Record<string, string>;

  /** Workflow parameters that can be passed at runtime */
  parameters?: WorkflowParameter[];

  /** Workflow metadata */
  metadata?: WorkflowMetadata;
}

/**
 * Individual workflow step definition
 */
export interface WorkflowStep {
  /** Step identifier */
  name: string;

  /** Step type */
  type: WorkflowStepType;

  /** Command to execute (for command type) */
  command?: string;

  /** Action identifier (for action type) */
  action?: string;

  /** Step-specific parameters */
  parameters?: Record<string, unknown>;

  /** Whether to continue on error */
  continue_on_error?: boolean;

  /** Step timeout in milliseconds */
  timeout?: number;

  /** Condition expression (for condition type) */
  condition?: string;

  /** Working directory for command execution */
  working_directory?: string;

  /** Environment variables for this step */
  environment?: Record<string, string>;

  /** Steps to run in parallel (for parallel type) */
  parallel_steps?: WorkflowStep[];

  /** Steps to run sequentially (for sequential type) */
  sequential_steps?: WorkflowStep[];

  /** Step dependencies */
  depends_on?: string[];

  /** Step retry configuration */
  retry?: RetryConfig;
}

/**
 * Workflow parameter definition
 */
export interface WorkflowParameter {
  /** Parameter name */
  name: string;

  /** Parameter description */
  description: string;

  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';

  /** Whether parameter is required */
  required: boolean;

  /** Default value */
  default?: unknown;

  /** Validation schema */
  validation?: z.ZodSchema;

  /** Possible values (for enum-like parameters) */
  enum?: unknown[];
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  max_attempts: number;

  /** Delay between retries in milliseconds */
  delay: number;

  /** Backoff strategy */
  backoff?: 'linear' | 'exponential';

  /** Maximum delay in milliseconds */
  max_delay?: number;

  /** Conditions that trigger retry */
  retry_on?: string[];
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  /** Author information */
  author?: string;

  /** Creation timestamp */
  created_at?: string;

  /** Last update timestamp */
  updated_at?: string;

  /** Workflow documentation URL */
  documentation?: string;

  /** License information */
  license?: string;

  /** Minimum required version of the system */
  min_version?: string;

  /** Workflow category */
  category?: string;

  /** Custom metadata */
  custom?: Record<string, unknown>;
}

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Global configuration interface
 */
export interface GlobalConfig {
  /** Global templates path */
  templates_path: string;

  /** Default timeout for workflows */
  default_timeout: number;

  /** Auto cleanup settings */
  auto_cleanup: boolean;

  /** Logging configuration */
  logging: LoggingConfig;

  /** Integration settings */
  integrations: IntegrationConfig;

  /** Project detection settings */
  project_detection: ProjectDetectionConfig;

  /** Security settings */
  security: SecurityConfig;
}

/**
 * Project-specific configuration interface
 */
export interface ProjectConfig {
  /** Project name */
  name: string;

  /** Project type */
  type: string;

  /** Project-specific workflows */
  workflows: Record<string, WorkflowConfig>;

  /** Project environment variables */
  environment: Record<string, string>;

  /** Project-specific integrations */
  integrations?: Partial<IntegrationConfig>;

  /** Project metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Workflow-specific configuration
 */
export interface WorkflowConfig {
  /** Workflow to extend */
  extends?: string;

  /** Override parameters */
  parameters?: Record<string, unknown>;

  /** Additional steps */
  steps?: WorkflowStep[];

  /** Environment overrides */
  environment?: Record<string, string>;

  /** Timeout override */
  timeout?: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';

  /** Log format */
  format: 'json' | 'text';

  /** Log output destinations */
  outputs: string[];

  /** Whether to log to file */
  file_logging: boolean;

  /** Log file path */
  log_file?: string;
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  /** GitHub integration */
  github?: GitHubConfig;

  /** Docker integration */
  docker?: DockerConfig;

  /** Custom integrations */
  custom?: Record<string, unknown>;
}

/**
 * GitHub integration configuration
 */
export interface GitHubConfig {
  /** Auto clean Augment descriptions */
  auto_clean_augment_descriptions: boolean;

  /** Default branch */
  default_branch: string;

  /** API token */
  token?: string;

  /** Repository settings */
  repository?: {
    owner: string;
    name: string;
  };
}

/**
 * Docker integration configuration
 */
export interface DockerConfig {
  /** Default image */
  default_image?: string;

  /** Registry settings */
  registry?: {
    url: string;
    username?: string;
    password?: string;
  };
}

/**
 * Project detection configuration
 */
export interface ProjectDetectionConfig {
  /** JavaScript project detection */
  javascript: ProjectTypeConfig;

  /** Python project detection */
  python: ProjectTypeConfig;

  /** Rust project detection */
  rust: ProjectTypeConfig;

  /** Go project detection */
  go: ProjectTypeConfig;

  /** Custom project types */
  custom?: Record<string, ProjectTypeConfig>;
}

/**
 * Project type configuration
 */
export interface ProjectTypeConfig {
  /** Files that indicate this project type */
  files: string[];

  /** File patterns that indicate this project type */
  patterns?: string[];

  /** Default workflows for this project type */
  default_workflows?: string[];
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Allowed commands */
  allowed_commands?: string[];

  /** Blocked commands */
  blocked_commands?: string[];

  /** Sandbox mode */
  sandbox_mode: boolean;

  /** Maximum execution time */
  max_execution_time: number;

  /** Environment variable restrictions */
  env_restrictions?: {
    allowed_vars?: string[];
    blocked_vars?: string[];
  };
}

// ============================================================================
// Execution Context and Results
// ============================================================================

/**
 * Workflow execution context
 * Contains all information needed during workflow execution
 */
export interface ExecutionContext {
  /** Unique execution ID */
  execution_id: string;

  /** Workflow being executed */
  workflow: Workflow;

  /** Runtime parameters */
  parameters: Record<string, unknown>;

  /** Execution environment */
  environment: Record<string, string>;

  /** Current working directory */
  working_directory: string;

  /** Execution start time */
  start_time: Date;

  /** Current step index */
  current_step_index: number;

  /** Execution status */
  status: WorkflowStatus;

  /** Dry run mode */
  dry_run: boolean;

  /** User context */
  user?: {
    id: string;
    name?: string;
    email?: string;
  };

  /** Session information */
  session?: {
    id: string;
    client_info?: Record<string, unknown>;
  };

  /** Execution metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Workflow execution result
 */
export interface ExecutionResult {
  /** Execution ID */
  execution_id: string;

  /** Workflow name */
  workflow_name: string;

  /** Overall execution status */
  status: WorkflowStatus;

  /** Execution start time */
  start_time: Date;

  /** Execution end time */
  end_time?: Date;

  /** Total execution duration in milliseconds */
  duration?: number;

  /** Step results */
  step_results: StepResult[];

  /** Final output */
  output?: unknown;

  /** Error information (if failed) */
  error?: WorkflowError;

  /** Execution logs */
  logs: LogEntry[];

  /** Resource usage statistics */
  resource_usage?: ResourceUsage;

  /** Execution metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Individual step execution result
 */
export interface StepResult {
  /** Step name */
  step_name: string;

  /** Step index in workflow */
  step_index: number;

  /** Step execution status */
  status: StepStatus;

  /** Step start time */
  start_time: Date;

  /** Step end time */
  end_time?: Date;

  /** Step duration in milliseconds */
  duration?: number;

  /** Step output */
  output?: unknown;

  /** Step error (if failed) */
  error?: StepError;

  /** Exit code (for command steps) */
  exit_code?: number;

  /** Standard output (for command steps) */
  stdout?: string;

  /** Standard error (for command steps) */
  stderr?: string;

  /** Retry attempts made */
  retry_attempts?: number;

  /** Step metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Log entry interface
 */
export interface LogEntry {
  /** Log timestamp */
  timestamp: Date;

  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';

  /** Log message */
  message: string;

  /** Log source (step name, system, etc.) */
  source: string;

  /** Additional log data */
  data?: Record<string, unknown>;

  /** Execution context */
  execution_id?: string;

  /** Step context */
  step_name?: string;
}

/**
 * Resource usage statistics
 */
export interface ResourceUsage {
  /** CPU usage percentage */
  cpu_usage?: number;

  /** Memory usage in bytes */
  memory_usage?: number;

  /** Disk I/O statistics */
  disk_io?: {
    read_bytes: number;
    write_bytes: number;
  };

  /** Network I/O statistics */
  network_io?: {
    bytes_sent: number;
    bytes_received: number;
  };

  /** Execution time breakdown */
  time_breakdown?: {
    setup_time: number;
    execution_time: number;
    cleanup_time: number;
  };
}

// ============================================================================
// Error and Exception Types
// ============================================================================

/**
 * Base workflow error interface
 */
export interface WorkflowError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error details */
  details?: Record<string, unknown>;

  /** Error stack trace */
  stack?: string;

  /** Timestamp when error occurred */
  timestamp: Date;

  /** Step where error occurred */
  step_name?: string;

  /** Retry information */
  retry_info?: {
    attempt: number;
    max_attempts: number;
    next_retry?: Date;
  };
}

/**
 * Step-specific error interface
 */
export interface StepError extends WorkflowError {
  /** Step index where error occurred */
  step_index: number;

  /** Exit code (for command errors) */
  exit_code?: number;

  /** Signal that caused termination */
  signal?: string;

  /** Whether error is retryable */
  retryable: boolean;
}

/**
 * Configuration error interface
 */
export interface ConfigError extends WorkflowError {
  /** Configuration file path */
  config_path?: string;

  /** Configuration section with error */
  config_section?: string;

  /** Validation errors */
  validation_errors?: string[];
}

/**
 * Parsing error interface
 */
export interface ParseError extends WorkflowError {
  /** File path being parsed */
  file_path: string;

  /** Line number where error occurred */
  line_number?: number;

  /** Column number where error occurred */
  column_number?: number;

  /** Parsing context */
  context?: string;
}

// ============================================================================
// Utility Types and Helpers
// ============================================================================

/**
 * Workflow validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error path (e.g., "steps[0].command") */
  path: string;

  /** Error message */
  message: string;

  /** Error code */
  code: string;

  /** Suggested fix */
  suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning path */
  path: string;

  /** Warning message */
  message: string;

  /** Warning code */
  code: string;

  /** Suggested improvement */
  suggestion?: string;
}

/**
 * Workflow template interface
 */
export interface WorkflowTemplate {
  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template category */
  category: string;

  /** Supported project types */
  project_types: string[];

  /** Template workflow */
  workflow: Partial<Workflow>;

  /** Template variables */
  variables?: TemplateVariable[];

  /** Template metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Template variable
 */
export interface TemplateVariable {
  /** Variable name */
  name: string;

  /** Variable description */
  description: string;

  /** Variable type */
  type: 'string' | 'number' | 'boolean';

  /** Default value */
  default?: unknown;

  /** Whether variable is required */
  required: boolean;

  /** Validation pattern */
  pattern?: string;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if an object is a Workflow
 */
export function isWorkflow(obj: unknown): obj is Workflow {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'description' in obj &&
    'version' in obj &&
    'scope' in obj &&
    'steps' in obj &&
    Array.isArray((obj as Workflow).steps)
  );
}

/**
 * Type guard to check if an object is a WorkflowStep
 */
export function isWorkflowStep(obj: unknown): obj is WorkflowStep {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'type' in obj &&
    typeof (obj as WorkflowStep).name === 'string' &&
    ['command', 'action', 'condition', 'parallel', 'sequential'].includes(
      (obj as WorkflowStep).type
    )
  );
}

/**
 * Type guard to check if an error is a WorkflowError
 */
export function isWorkflowError(error: unknown): error is WorkflowError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}
