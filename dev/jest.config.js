module.exports = {
  verbose: true,
  globalSetup: '<rootDir>/test/globalSetup.ts',
  globalTeardown: '<rootDir>/test/globalTeardown.ts',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': '<rootDir>/../node_modules/@swc/jest',
    // '^.+\\.(t)s?$': '<rootDir>/node_modules/@swc/jest',
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test/mocks/fileStub.js',
    '\\.(css|scss)$': '<rootDir>/test/mocks/fileStub.js',
  },
}
