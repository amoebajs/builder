const path = require("path");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.(spec|test).{ts,tsx}", "<rootDir>/src/**/*.(spec|test).{ts,tsx}"],
};
