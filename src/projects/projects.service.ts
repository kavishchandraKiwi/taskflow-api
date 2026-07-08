import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createProject(createProjectDto: CreateProjectDto, user: { user_id: number }) {
    const projectName = createProjectDto.project_name;
    if (!projectName) {
      throw new BadRequestException('project_name is required');
    }

    const description = createProjectDto.description ?? createProjectDto.project_description ?? null;
    const deadline = createProjectDto.deadline ?? null;

    const existing = await this.databaseService.getPool().query(
      `SELECT 1 FROM projects WHERE owner_user_id = $1 AND project_name = $2`,
      [user.user_id, projectName],
    );

    if (existing.rowCount && existing.rowCount > 0) {
      throw new ConflictException('You already own a project with this name');
    }

    const projectResult = await this.databaseService.getPool().query(
      `
        INSERT INTO projects (project_name, description, deadline, owner_user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING project_id, project_name, description, deadline, owner_user_id, time_created
      `,
      [projectName, description, deadline, user.user_id],
    );

    const project = projectResult.rows[0];

    await this.databaseService.getPool().query(
      `INSERT INTO projects_members (project_id, user_id) VALUES ($1, $2)`,
      [project.project_id, user.user_id],
    );

    return project;
  }

  async listUserProjects(user: { user_id: number }) {
    const res = await this.databaseService.getPool().query(
      `
        SELECT DISTINCT p.project_id, p.project_name, p.description, p.deadline, p.owner_user_id, p.time_created
        FROM projects p
        JOIN projects_members pm ON pm.project_id = p.project_id
        WHERE pm.user_id = $1
        ORDER BY p.time_created DESC
      `,
      [user.user_id],
    );

    return res.rows;
  }

  async getProjectById(projectId: number, user: { user_id: number }) {
    const membership = await this.databaseService.getPool().query(
      `SELECT 1 FROM projects_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, user.user_id],
    );

    if (!membership.rowCount) {
      throw new NotFoundException('Project not found');
    }

    const res = await this.databaseService.getPool().query(
      `SELECT project_id, project_name, description, deadline, owner_user_id, time_created FROM projects WHERE project_id = $1`,
      [projectId],
    );

    if (!res.rowCount) {
      throw new NotFoundException('Project not found');
    }

    return res.rows[0];
  }

  async updateProject(projectId: number, updateProjectDto: UpdateProjectDto, user: { user_id: number }) {
    const project = await this.databaseService.getPool().query(
      `SELECT owner_user_id FROM projects WHERE project_id = $1`,
      [projectId],
    );

    if (!project.rowCount) {
      throw new NotFoundException('Project not found');
    }

    if (project.rows[0].owner_user_id !== user.user_id) {
      throw new ForbiddenException('Only the project owner can update this project');
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (updateProjectDto.project_name) {
      fields.push(`project_name = $${index}`);
      values.push(updateProjectDto.project_name);
      index += 1;
    }

    const descriptionValue = updateProjectDto.description ?? updateProjectDto.updated_description;
    if (descriptionValue !== undefined) {
      fields.push(`description = $${index}`);
      values.push(descriptionValue);
      index += 1;
    }

    if (updateProjectDto.deadline !== undefined) {
      fields.push(`deadline = $${index}`);
      values.push(updateProjectDto.deadline);
      index += 1;
    }

    if (fields.length === 0) {
      return this.getProjectById(projectId, user);
    }

    values.push(projectId);

    const res = await this.databaseService.getPool().query(
      `UPDATE projects SET ${fields.join(', ')} WHERE project_id = $${index} RETURNING project_id, project_name, description, deadline, owner_user_id, time_created`,
      values,
    );

    return res.rows[0];
  }

  async deleteProject(projectId: number, user: { user_id: number }) {
    const project = await this.databaseService.getPool().query(
      `SELECT owner_user_id FROM projects WHERE project_id = $1`,
      [projectId],
    );

    if (!project.rowCount) {
      throw new NotFoundException('Project not found');
    }

    if (project.rows[0].owner_user_id !== user.user_id) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.databaseService.getPool().query(`DELETE FROM projects WHERE project_id = $1`, [projectId]);

    return { message: 'Project deleted' };
  }

  async addMemberToProject(projectId: number, email: string, user: { user_id: number }) {
    const project = await this.databaseService.getPool().query(
      `SELECT owner_user_id FROM projects WHERE project_id = $1`,
      [projectId],
    );

    if (!project.rowCount) {
      throw new NotFoundException('Project not found');
    }

    if (project.rows[0].owner_user_id !== user.user_id) {
      throw new ForbiddenException('Only the project owner can add members');
    }

    const targetUser = await this.databaseService.getPool().query(
      `SELECT user_id FROM users WHERE email = $1`,
      [email],
    );

    if (!targetUser.rowCount) {
      throw new NotFoundException('User not found');
    }

    const targetUserId = targetUser.rows[0].user_id;
    const memberExists = await this.databaseService.getPool().query(
      `SELECT 1 FROM projects_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, targetUserId],
    );

    if (memberExists.rowCount) {
      throw new ConflictException('User is already a member of the project');
    }

    await this.databaseService.getPool().query(
      `INSERT INTO projects_members (project_id, user_id) VALUES ($1, $2)`,
      [projectId, targetUserId],
    );

    return { message: 'Member added' };
  }

  async listProjectMembers(projectId: number, user: { user_id: number }) {
    const project = await this.databaseService.getPool().query(
      `SELECT 1 FROM projects WHERE project_id = $1`,
      [projectId],
    );

    if (!project.rowCount) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.databaseService.getPool().query(
      `SELECT 1 FROM projects_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, user.user_id],
    );

    if (!membership.rowCount) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const res = await this.databaseService.getPool().query(
      `
        SELECT u.user_id, u.email, u.username
        FROM users u
        JOIN projects_members pm ON u.user_id = pm.user_id
        WHERE pm.project_id = $1
        ORDER BY u.username
      `,
      [projectId],
    );

    return res.rows;
  }
}

