import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BadRequestException, NotFoundException, ForbiddenException} from '@nestjs/common';

@Injectable()
export class TasksService {
  constructor(private readonly databaseService: DatabaseService) {}

  private async checkProjectMembership(projectId: number, user: { user_id: number }) {
    const project = await this.databaseService.getPool().query(
      `SELECT 1 FROM projects WHERE project_id = $1 `,
      [projectId],
    );

    if (project.rowCount === 0) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.databaseService.getPool().query(
      `SELECT 1 FROM projects_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, user.user_id],
    );

    if (membership.rowCount === 0) {
      throw new ForbiddenException('You are not a member of this project');
    }


    }
    private async checkProjectOwnership(projectId: number, user: { user_id: number }) {
      const project = await this.databaseService.getPool().query(
        `SELECT owner_user_id FROM projects WHERE project_id = $1`,
        [projectId],
      );
  
      if (project.rowCount === 0) {
        throw new NotFoundException('Project not found');
      }
  
      if (project.rows[0].owner_user_id !== user.user_id) {
        throw new ForbiddenException('You are not the owner of this project');
      }
    }

    private async validateAssignee(projectId: number, assigneeId: number | undefined | null) {
        if (assigneeId === undefined || assigneeId === null) {
        return;
        }

        const userResult = await this.databaseService.getPool().query(
        `SELECT user_id FROM users WHERE user_id = $1`,
        [assigneeId],
        );

        if (!userResult.rowCount) {
        throw new BadRequestException('assigned user does not exist ');
        }

        const membership = await this.databaseService.getPool().query(
        `SELECT 1 FROM projects_members WHERE project_id = $1 AND user_id = $2`,
        [projectId, assigneeId],
        );

        if (!membership.rowCount) {
        throw new BadRequestException('assigned user must be a member of this project');
        }
    }
    async createTask(projectId: number, createTaskDto: CreateTaskDto, user: { user_id: number }) {
        await this.checkProjectMembership(projectId, user);
        await this.validateAssignee(projectId, createTaskDto.assigned_to_user_id);
        //default status during input should be to do
        const result = await this.databaseService.getPool().query(
        `
        INSERT INTO tasks (project_id, title, description, priority, status,
            due_date, assigned_to_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            projectId, createTaskDto.title, createTaskDto.description || null, createTaskDto.priority, createTaskDto.status || 'todo', createTaskDto.due_date || null, createTaskDto.assigned_to_user_id || null
        ]
        );
        return result.rows[0];
    }

    async listTasks(projectId: number, user: {user_id: number}){
        await this.checkProjectMembership(projectId, user);

        const result = await this.databaseService.getPool().query(
            `
            SELECT
          task_id,
          title,
          description,
          priority,
          status,
          due_date,
          project_id,
          assigned_by_user_id,
          assigned_to_user_id
        FROM tasks
        WHERE project_id = $1
        ORDER BY task_id
            `, [projectId],
        );
        return result.rows;
    }

    async getTask(projectId: number, taskId: number, user: {user_id: number}){
        await this.checkProjectMembership(projectId,user);

        const result = await this.databaseService.getPool().query(
            `
            SELECT
            task_id, title,
            description, priority, status,
            due_date, project_id, assigned_by_user_id,
            assigned_to_user_id
            FROM tasks
            WHERE task_id = $1 AND project_id = $2
            `, [taskId, projectId],
        );

        if(result.rowCount==0) throw new NotFoundException('task not found');

        return result.rows[0];
    }

    async updateTask(projectId: number,
    taskId: number,
    updateTaskDto: {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      due_date?: string | Date;
      assigned_to_user_id?: number | null;
    },
    user: { user_id: number }){
        await this.checkProjectMembership(projectId,user);
        const existing = await this.databaseService.getPool().query(
            `SELECT * FROM tasks WHERE task_id = $1 AND project_id = $2`,
            [taskId, projectId],
        );
        if(existing.rowCount == 0) throw new NotFoundException('task not found');

        const fields: string[] = [];
        const values: string[] = [];
        let index = 1; 
        
    }

}


    




