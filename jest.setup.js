import 'react-native-gesture-handler/jestSetup';
// import jestFetchMock from 'jest-fetch-mock';

// jestFetchMock.enableMocks();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// Mock Keyboard Controller (missing dependency of GiftedChat)
jest.mock('react-native-keyboard-controller', () => ({
    KeyboardController: {
        setInputMode: jest.fn(),
        setDefaultMode: jest.fn(),
    },
    useKeyboardHandler: jest.fn(),
}));

// Mock Google Signin
jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn().mockResolvedValue({ user: { id: 'test' } }),
        signInSilently: jest.fn().mockResolvedValue({ user: { id: 'test' } }),
        signOut: jest.fn(),
        getCurrentUser: jest.fn().mockResolvedValue(null),
    },
}));

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

global.console = {
    ...console,
    // error: jest.fn(), // Uncomment to silence console.error during tests
};
