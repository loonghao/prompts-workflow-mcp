/**
 * Prompts Workflow MCP Server Entry Point
 *
 * This is the main entry point for the MCP server that enables AI assistants
 * to execute predefined workflows through natural language commands.
 */

import { MCPServer } from './server/mcp-server.js';

export const version = '0.1.0';
export { MCPServer };

/**
 * Main function to start the MCP server
 */
export async function main(): Promise<void> {
  try {
    const server = new MCPServer();
    await server.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// If this file is run directly, start the server
if (require.main === module) {
  main().catch((error: unknown) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
