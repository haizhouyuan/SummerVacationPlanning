module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  // 跳过MongoDB相关测试
  testPathIgnorePatterns: [
    '/node_modules/',
    'setup.ts',
    'dailyTaskController.test.ts',
    'dailyTaskWorkflow.test.ts',
    'pointsCalculation.test.ts',
    'statisticsApi.test.ts',
    'fileUploadSecurity.test.ts',
    'recommendationService.test.ts'
  ],
};