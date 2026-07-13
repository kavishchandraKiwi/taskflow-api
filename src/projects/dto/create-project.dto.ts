import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  project_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Keep only if your service still references it
  @IsOptional()
  @IsString()
  project_description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}