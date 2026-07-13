import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  project_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Keep only if your service still references it
  @IsOptional()
  @IsString()
  updated_description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}