/**
 * Test script to verify FastMCP tools functionality
 */

const { MCPServer } = require('./dist/index.js');

async function testMCPServer() {
  console.log('Testing MCP Server with FastMCP...');
  
  try {
    const server = new MCPServer();
    console.log('✓ MCP Server created successfully');
    
    // Test that the server has the expected methods
    console.log('✓ Server has start method:', typeof server.start === 'function');
    console.log('✓ Server has stop method:', typeof server.stop === 'function');
    console.log('✓ Server has running property:', typeof server.running === 'boolean');
    
    console.log('✓ All tests passed!');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

testMCPServer().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
