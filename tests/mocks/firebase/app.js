const apps = [];
const app = { name: '[DEFAULT]' };

const firebase = {
  apps,
  app: jest.fn(() => app),
  initializeApp: jest.fn((config) => {
    apps.push({ ...app, options: config });
    return app;
  }),
};

module.exports = firebase;
module.exports.default = firebase;
