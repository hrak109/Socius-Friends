module.exports = {
    preset: "jest-expo",
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage|@react-native-google-signin/google-signin)"
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1"
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    collectCoverage: true,
    collectCoverageFrom: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "utils/**/*.{ts,tsx}",
        "!**/coverage/**",
        "!**/node_modules/**",
        "!**/babel.config.js",
        "!**/jest.setup.js"
    ]
};
