import { SocialProvider } from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { validate } from 'class-validator';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import { weightedLength } from '@gitroom/helpers/utils/count.length';
import { AllProvidersSettings } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/all.providers.settings';

export interface ValidationError {
  value: string;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  outputText: string;
  errors: ValidationError[];
}

function countCharacters(text: string, identifier: string): number {
  if (identifier !== 'x') {
    return text.length;
  }
  return weightedLength(text);
}

export async function validatePostContent(
  provider: SocialProvider,
  content: string,
  settings: Array<{ key: string; value: any }>,
  isPremium = false
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  const maximumCharacters = provider.maxLength(isPremium);
  const strip = stripHtmlValidation('normal', content, true);
  const calculatedLength = countCharacters(strip, provider.identifier || '');
  const totalCharacters =
    calculatedLength > strip.length ? calculatedLength : strip.length;

  if (totalCharacters > maximumCharacters || strip.trim().length === 0) {
    errors.push({
      value: content,
      error: totalCharacters > maximumCharacters
        ? `The maximum characters is ${maximumCharacters}, we got ${totalCharacters}`
        : 'Content cannot be empty or whitespace only',
    });
  }

  if (provider.dto) {
    const newDTO = new provider.dto();
    const obj = Object.assign(
      newDTO,
      settings.reduce(
        (acc: AllProvidersSettings, s: { key: string; value: any }) => ({
          ...acc,
          [s.key]: s.value,
        }),
        {} as AllProvidersSettings
      )
    );
    const validationErrors = await validate(obj);

    if (validationErrors.length > 0) {
      validationErrors.forEach((e) => {
        if (e.constraints) {
          Object.values(e.constraints).forEach((msg) => {
            errors.push({ value: content, error: msg });
          });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    outputText: strip,
    errors,
  };
}
