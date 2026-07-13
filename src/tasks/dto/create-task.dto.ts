import { IsString, IsOptional, IsNotEmpty, IsEnum, IsDateString, IsInt, } from "class-validator";

export enum Priority{
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum Status{
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Priority)
  priority: Priority;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsInt()
  assigned_to_user_id?: number;
}

