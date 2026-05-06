import { DiscordProvider } from '@gitroom/nestjs-libraries/integrations/social/discord.provider';
import { validatePostContent } from '@gitroom/nestjs-libraries/utils/post-validation.util';

interface ValidationTestCase {
  name: string;
  input: {
    content: string;
    settings?: Array<{ key: string; value: any }>;
  };
  expected_output: {
    status: 'pass' | 'fail';
    outputText?: string;
  };
}

describe('Discord Provider Validation', () => {
  const discordProvider = new DiscordProvider();

  const testCases: ValidationTestCase[] = [
    {
      name: 'Valid short post',
      input: {
        content: 'Hello Discord!',
        settings: [{ key: 'channel', value: '123456789' }],
      },
      expected_output: { status: 'pass' },
    },
    {
      name: 'Valid post at max length',
      input: {
        content: 'a'.repeat(1980),
        settings: [{ key: 'channel', value: '123456789' }],
      },
      expected_output: { status: 'pass' },
    },
    {
      name: 'Invalid post exceeds max length',
      input: {
        content: 'a'.repeat(1981),
        settings: [{ key: 'channel', value: '123456789' }],
      },
      expected_output: { status: 'fail' },
    },
    {
      name: 'Invalid missing channel setting',
      input: {
        content: 'Hello Discord!',
        settings: [],
      },
      expected_output: { status: 'fail' },
    },
    {
      name: 'Invalid empty channel setting',
      input: {
        content: 'Hello Discord!',
        settings: [{ key: 'channel', value: '' }],
      },
      expected_output: { status: 'fail' },
    },
    {
      name: 'Valid post with HTML content',
      input: {
        content: '<p>Hello <strong>Discord</strong>!</p>',
        settings: [{ key: 'channel', value: '123456789' }],
      },
      expected_output: {
        status: 'pass',
        outputText: 'Hello 𝗗𝗶𝘀𝗰𝗼𝗿𝗱!',
      },
    },
  ];

  describe.each(testCases)(
    'Validation Test: $name',
    ({ input, expected_output }) => {
      it(`should ${expected_output.status}`, async () => {
        const result = await validatePostContent(
          discordProvider,
          input.content,
          input.settings || [],
          false
        );

        if (expected_output.status === 'pass') {
          expect(result.valid).toBe(true);
        } else {
          expect(result.valid).toBe(false);
        }

        if (expected_output.outputText) {
          expect(result.outputText).toBe(expected_output.outputText);
        }
      });
    }
  );
});
