# Socius Friends - Testing Guide

This guide details the testing strategy, infrastructure, and best practices for the Socius Friends mobile application.

---

## Core Philosophy

We follow a **"Big Tech Ready"** testing standard:
1. **Never Break Main**: All PRs must pass linting, type-checking, and unit tests.
2. **Mocking Externalities**: Native modules, API calls, and complex UI components are mocked to ensure fast, deterministic tests.
3. **Coverage Matters**: Aim for high coverage in critical business logic (Hooks, Utils).

---

## Test Infrastructure

- **Runner**: [Jest](https://jestjs.io/)
- **Preset**: `jest-expo` (essential for React Native/Expo compatibility)
- **Library**: `@testing-library/react-native`
- **Mocks**: Global mocks in `jest.setup.js`

---

## Running Tests

### Standard Run
```bash
npm test
```

### With Coverage Report
```bash
npm run test:coverage
```
Coverage reports are generated in the `/coverage` directory.

### Watch Mode (Development)
```bash
npx jest --watch
```

---

## Test Categories

### 1. Unit Tests (Logic)
Located in `**/__tests__/*.test.ts`. Focus on pure functions and logic.
- Example: [utils/__tests__/date.test.ts](file:///home/hbb/hai-project/socius-friends/utils/__tests__/date.test.ts)

### 2. Hook Tests
Located in `hooks/__tests__/`. We use `renderHook` to test the state and effects of our custom hooks.
- Example: [hooks/__tests__/useChat.test.ts](file:///home/hbb/hai-project/socius-friends/hooks/__tests__/useChat.test.ts)

### 3. Component (Interaction) Tests
Located in `components/**/__tests__/`. We test that components render correctly and handle user interactions.
- Example: [components/features/chat/__tests__/ChatInterface.test.tsx](file:///home/hbb/hai-project/socius-friends/components/features/chat/__tests__/ChatInterface.test.tsx)

---

## Best Practices for Adding Tests

### Mocking the API
Do not make real network calls. Use the mocked `api` service:
```typescript
import api from '@/services/api';
jest.mock('@/services/api');

(api.get as jest.Mock).mockResolvedValue({ data: [] });
```

### Mocking Native Modules
If a test fails with "Cannot find module 'react-native-...'":
1. Add the mock to [jest.setup.js](file:///home/hbb/hai-project/socius-friends/jest.setup.js).
2. Use `virtual: true` if the module isn't installed in the test environment (e.g., native-only dependencies).

### Testing Async Code
Use `act` from `@testing-library/react-native` for state updates or async operations inside hooks:
```typescript
await act(async () => {
    result.current.onSend([...]);
});
```

---

## CI/CD Integration

This testing suite is integrated into **GitHub Actions**. Any pull request that fails these tests cannot be merged.
- Workflow: [ci.yml](file:///home/hbb/hai-project/socius-friends/.github/workflows/ci.yml)
