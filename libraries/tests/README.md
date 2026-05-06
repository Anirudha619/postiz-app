# Provider Validation Tests

This directory contains tests for social media provider validations.

## Running Tests

```bash
# Run all provider tests
pnpm test:providers

# Or directly with Jest
NODE_OPTIONS="--max-old-space-size=8192" jest --config libraries/tests/jest.config.js
```

## Test Structure

Tests validate the following for each provider:

1. **maxLength** - Character limit validation
2. **DTO validation** - Settings validation using class-validator
3. **handleErrors** - API error handling validation

## Adding Tests for New Providers

Create a new file: `libraries/tests/{provider}.provider.validation.spec.ts`

Example structure:

```typescript
import { XProvider } from '@gitroom/nestjs-libraries/integrations/social/x.provider';

describe('X Provider Validation', () => {
  const provider = new XProvider();

  describe('maxLength validation', () => {
    it('should return 200 for standard accounts', () => {
      expect(provider.maxLength(false)).toBe(200);
    });

    it('should return 4000 for premium accounts', () => {
      expect(provider.maxLength(true)).toBe(4000);
    });
  });

  describe('handleErrors validation', () => {
    it('should handle duplicate posts', () => {
      const result = provider.handleErrors('duplicate-rules');
      expect(result?.type).toBe('bad-body');
    });
  });
});
```

## Files

- `jest.config.js` - Jest configuration
- `discord.provider.validation.spec.ts` - Discord provider tests (example)
- `provider-validation.tester.ts` - Reusable test utility (optional)
- `run-discord-tests.ts` - Standalone test runner (alternative)
