export class CreateTaskDto {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in_progress' | 'done';
  due_date?: string | Date;
  assigned_to_user_id?: number;
}
