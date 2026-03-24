/**
 * Command Execution Utilities
 *
 * Provides secure command execution with timeout, environment control,
 * and output capture. Includes security features for safe execution.
 */

import { spawn, ChildProcess } from 'child_process';

import { Logger } from './logger.js';

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: boolean;
  input?: string;
}

export interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  signal?: string | null;
  error?: Error;
}

export class CommandExecutor {
  private logger: Logger;
  private allowedCommands: string[];
  private blockedCommands: string[];
  private maxExecutionTime: number;

  constructor(
    allowedCommands: string[] = [],
    blockedCommands: string[] = [],
    maxExecutionTime: number = 300000 // 5 minutes default
  ) {
    this.logger = new Logger('CommandExecutor');
    this.allowedCommands = allowedCommands;
    this.blockedCommands = blockedCommands;
    this.maxExecutionTime = maxExecutionTime;
  }

  /**
   * Execute a command with security checks
   */
  async execute(
    command: string,
    options: CommandOptions = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      // Security validation
      if (!this.isCommandAllowed(command)) {
        throw new Error(`Command not allowed: ${command}`);
      }

      this.logger.info(`Executing command: ${command}`, { cwd: options.cwd });

      const result = await this.executeCommand(command, options);
      const duration = Date.now() - startTime;

      this.logger.info(`Command completed`, {
        exitCode: result.exitCode,
        duration,
        success: result.success,
      });

      return { ...result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Command failed: ${command}`, error);

      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeSequence(
    commands: string[],
    options: CommandOptions = {}
  ): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const command of commands) {
      const result = await this.execute(command, options);
      results.push(result);

      // Stop on first failure unless continue_on_error is set
      if (!result.success && !options.env?.['CONTINUE_ON_ERROR']) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute commands in parallel
   */
  async executeParallel(
    commands: string[],
    options: CommandOptions = {}
  ): Promise<CommandResult[]> {
    const promises = commands.map(command => this.execute(command, options));
    return Promise.all(promises);
  }

  /**
   * Check if a command is allowed to execute
   */
  private isCommandAllowed(command: string): boolean {
    const commandName = this.extractCommandName(command);

    // Check blocked commands first
    if (
      this.blockedCommands.some(blocked =>
        commandName.toLowerCase().includes(blocked.toLowerCase())
      )
    ) {
      return false;
    }

    // If allowlist is empty, allow all (except blocked)
    if (this.allowedCommands.length === 0) {
      return true;
    }

    // Check if command is in allowlist
    return this.allowedCommands.some(allowed =>
      commandName.toLowerCase().startsWith(allowed.toLowerCase())
    );
  }

  /**
   * Extract the main command name from a command string
   */
  private extractCommandName(command: string): string {
    return command.trim().split(' ')[0] || '';
  }

  /**
   * Execute the actual command
   */
  private executeCommand(
    command: string,
    options: CommandOptions
  ): Promise<CommandResult> {
    return new Promise(resolve => {
      const timeout = options.timeout || this.maxExecutionTime;
      const env = { ...process.env, ...options.env };

      // Parse command and arguments
      const [cmd, ...args] = command.split(' ');

      if (!cmd) {
        throw new Error('Invalid command: empty command string');
      }

      const child: ChildProcess = spawn(cmd, args, {
        cwd: options.cwd || process.cwd(),
        env,
        shell: options.shell !== false, // Default to true for compatibility
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGTERM');

        // Force kill after 5 seconds
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Handle stdout
      if (child.stdout) {
        child.stdout.on('data', data => {
          stdout += data.toString();
        });
      }

      // Handle stderr
      if (child.stderr) {
        child.stderr.on('data', data => {
          stderr += data.toString();
        });
      }

      // Send input if provided
      if (options.input && child.stdin) {
        child.stdin.write(options.input);
        child.stdin.end();
      }

      // Handle process completion
      child.on('close', (code, signal) => {
        clearTimeout(timeoutId);

        const result: CommandResult = {
          success: code === 0 && !isTimedOut,
          exitCode: code || -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: 0, // Will be set by caller
          signal: signal || null,
        };

        if (isTimedOut) {
          result.error = new Error(`Command timed out after ${timeout}ms`);
          result.stderr += `\nCommand timed out after ${timeout}ms`;
        }

        resolve(result);
      });

      // Handle process errors
      child.on('error', error => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          exitCode: -1,
          stdout: stdout.trim(),
          stderr: `${stderr.trim()}\n${error.message}`,
          duration: 0,
          error,
        });
      });
    });
  }

  /**
   * Test if a command exists and is executable
   */
  async testCommand(command: string): Promise<boolean> {
    try {
      const testCmd = `${process.platform === 'win32' ? 'where' : 'which'} ${command}`;

      const result = await this.execute(testCmd, { timeout: 5000 });
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get command version
   */
  async getCommandVersion(command: string): Promise<string | null> {
    try {
      const result = await this.execute(`${command} --version`, {
        timeout: 5000,
      });
      return result.success ? result.stdout.split('\n')[0] || null : null;
    } catch {
      return null;
    }
  }
}
