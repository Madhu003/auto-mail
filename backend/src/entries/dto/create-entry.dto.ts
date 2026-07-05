import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  rawPostText!: string;
}
