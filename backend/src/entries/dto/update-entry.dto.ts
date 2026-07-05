import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;
}
