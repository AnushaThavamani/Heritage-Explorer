module.exports = {
  preset: '@react-native/jest-preset',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve('@react-native/jest-preset/jest/assetFileTransformer.js'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-safe-area-context|react-redux|@reduxjs|redux|immer|reselect|use-sync-external-store)/)',
  ],
  moduleNameMapper: {
    '@react-native-async-storage/async-storage': '<rootDir>/__mocks__/asyncStorage.js',
  },
};
