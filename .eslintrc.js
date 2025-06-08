module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'no-unused-vars': 'off', // Disable for TypeScript files
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
  overrides: [
    {
      files: ['src/cli/**/*.ts', 'src/index.ts', 'src/utils/logger.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
