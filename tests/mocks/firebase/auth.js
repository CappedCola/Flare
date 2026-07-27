const auth = { currentUser: null };

module.exports = {
  getAuth: jest.fn(() => auth),
};
