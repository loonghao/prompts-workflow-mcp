#!/usr/bin/env node

/**
 * Pre-publish check script
 * Validates that the package is ready for npm publication
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running pre-publish checks...\n');

// Check 1: Verify package.json
console.log('1. Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'repository', 'license'];
const missingFields = requiredFields.filter(field => !packageJson[field]);

if (missingFields.length > 0) {
  console.error(`❌ Missing required fields in package.json: ${missingFields.join(', ')}`);
  process.exit(1);
}

console.log('✅ package.json is valid');

// Check 2: Verify build artifacts exist
console.log('\n2. Checking build artifacts...');
const requiredFiles = [
  'dist/index.js',
  'dist/cli/index.js',
  'bin/prompts-workflow-mcp'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error(`❌ Missing build artifacts: ${missingFiles.join(', ')}`);
  console.log('Run "npm run build" to generate build artifacts');
  process.exit(1);
}

console.log('✅ Build artifacts exist');

// Check 3: Verify templates and schemas
console.log('\n3. Checking templates and schemas...');
const templateFiles = [
  'templates/javascript/create-pr.yaml',
  'templates/python/create-pr.yaml',
  'templates/rust/create-pr.yaml'
];

const schemaFiles = [
  'schemas/workflow.schema.json'
];

const missingTemplates = templateFiles.filter(file => !fs.existsSync(file));
const missingSchemas = schemaFiles.filter(file => !fs.existsSync(file));

if (missingTemplates.length > 0) {
  console.error(`❌ Missing template files: ${missingTemplates.join(', ')}`);
  process.exit(1);
}

if (missingSchemas.length > 0) {
  console.error(`❌ Missing schema files: ${missingSchemas.join(', ')}`);
  process.exit(1);
}

console.log('✅ Templates and schemas exist');

// Check 4: Verify documentation
console.log('\n4. Checking documentation...');
const docFiles = ['README.md', 'README_zh.md', 'CHANGELOG.md', 'LICENSE'];
const missingDocs = docFiles.filter(file => !fs.existsSync(file));

if (missingDocs.length > 0) {
  console.error(`❌ Missing documentation files: ${missingDocs.join(', ')}`);
  process.exit(1);
}

console.log('✅ Documentation files exist');

// Check 5: Run tests
console.log('\n5. Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ All tests passed');
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

// Check 6: Check package size
console.log('\n6. Checking package size...');
try {
  const output = execSync('npm pack --dry-run', { encoding: 'utf8' });
  const sizeMatch = output.match(/package size:\s*(\d+(?:\.\d+)?)\s*(\w+)/i);
  
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toLowerCase();
    
    console.log(`📦 Package size: ${size} ${unit}`);
    
    // Warn if package is too large (>10MB)
    const sizeInMB = unit === 'mb' ? size : unit === 'kb' ? size / 1024 : size / (1024 * 1024);
    
    if (sizeInMB > 10) {
      console.warn(`⚠️  Package size is quite large (${sizeInMB.toFixed(2)} MB). Consider optimizing.`);
    } else {
      console.log('✅ Package size is reasonable');
    }
  }
} catch (error) {
  console.warn('⚠️  Could not determine package size');
}

// Check 7: Verify CLI functionality
console.log('\n7. Testing CLI functionality...');
try {
  execSync('node bin/prompts-workflow-mcp --help', { stdio: 'pipe' });
  execSync('node bin/prompts-workflow-mcp validate examples/simple-workflow.yaml', { stdio: 'pipe' });
  console.log('✅ CLI functionality works');
} catch (error) {
  console.error('❌ CLI functionality test failed');
  process.exit(1);
}

console.log('\n🎉 All pre-publish checks passed!');
console.log('\nNext steps:');
console.log('1. Make sure you are logged in to npm: npm whoami');
console.log('2. Publish the package: npm publish');
console.log('3. Create a git tag: git tag v' + packageJson.version);
console.log('4. Push the tag: git push origin v' + packageJson.version);
