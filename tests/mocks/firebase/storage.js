const storage = {};

module.exports = {
  getStorage: jest.fn(() => storage),
  connectStorageEmulator: jest.fn(),
};
