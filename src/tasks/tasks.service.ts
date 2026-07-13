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
    


}
