module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  testMatch: ['<rootDir>/src/**/*spec.(t|j)s', '<rootDir>/test/**/*spec.(t|j)s'],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/src/__tests__/'],
  testTimeout: 600_000,
};
