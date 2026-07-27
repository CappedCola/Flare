const reportDirectory = process.env.REPORT_DIR || '<rootDir>/test-reports';

module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@react-native-firebase/app$': '<rootDir>/tests/mocks/firebase/app.js',
    '^@react-native-firebase/auth$': '<rootDir>/tests/mocks/firebase/auth.js',
    '^@react-native-firebase/firestore$': '<rootDir>/tests/mocks/firebase/firestore.js',
    '^@react-native-firebase/storage$': '<rootDir>/tests/mocks/firebase/storage.js',
  },
  coverageDirectory: process.env.COVERAGE_DIR || '<rootDir>/coverage',
  coverageReporters: ['json', 'text'],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: reportDirectory, outputName: 'junit.xml', ancestorSeparator: ' > ' }],
  ],
};
