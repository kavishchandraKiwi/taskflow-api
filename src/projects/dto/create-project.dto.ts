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

  
  @IsOptional()
  @IsString()
  project_description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}