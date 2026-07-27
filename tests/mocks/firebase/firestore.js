const firestore = {
  collection: jest.fn(() => ({
    limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
  })),
};

module.exports = {
  getFirestore: jest.fn(() => firestore),
  connectFirestoreEmulator: jest.fn(),
};
