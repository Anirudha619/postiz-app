import { IsDefined, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { JSONSchema } from 'class-validator-jsonschema';

export class DiscordDto {
  @MinLength(1)
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @Matches(/[^\s]/, { message: 'channel must not be empty or whitespace' })
    @JSONSchema({
    description: 'Channel must be an id',
  })
  channel: string;
}
