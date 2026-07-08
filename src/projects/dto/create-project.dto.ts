export class CreateProjectDto {
  project_name: string;
  description?: string;
  project_description?: string;
  deadline?: string | Date;
}