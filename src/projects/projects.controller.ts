import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  private getAuthenticatedUser(req: ExpressRequest & { user?: { user_id: number; email: string } }) {
    if (!req.user?.user_id) {
      throw new UnauthorizedException('user not authenticated');
    }

    return req.user;
  }

  private parseId(value: string, fieldName: string) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid integer`);
    }
    return parsed;
  }

  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: ExpressRequest & { user?: { user_id: number; email: string } },
  ) {
    const user = this.getAuthenticatedUser(req);
    return this.projectsService.createProject(createProjectDto, user);
  }

  @Get()
  async listUserProjects(@Request() req: ExpressRequest & { user?: { user_id: number; email: string } }) {
    const user = this.getAuthenticatedUser(req);
    return this.projectsService.listUserProjects(user);
  }

  @Get(':id')
  async getProject(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: { user_id: number; email: string } },
  ) {
    const user = this.getAuthenticatedUser(req);
    return this.projectsService.getProjectById(this.parseId(id, 'project id'), user);
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: ExpressRequest & { user?: { user_id: number; email: string } },
  ) {
    const user = this.getAuthenticatedUser(req);
    return this.projectsService.updateProject(this.parseId(id, 'project id'), updateProjectDto, user);
  }

  @Delete(':id')
  async deleteProject(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: { user_id: number; email: string } },
  ) {
    const user = this.getAuthenticatedUser(req);
    return this.projectsService.deleteProject(this.parseId(id, 'project id'), user);
  }

  @Post(':id/members')
  async addMemberToProject(
    @Param('id') id: string,
    @Body() body: { email: string },
    @Request() req: ExpressRequest & { user?: { user_id: number; email: string } },
  ) {
    const user = this.getAuthenticatedUser(req);
    return this.projectsService.addMemberToProject(this.parseId(id, 'project id'), body.email, user);
  }

  @Get(':id/members')
  async listProjectMembers(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: { user_id: number; email: string } },
  ) {
    const user = this.getAuthenticatedUser(req);
    return this.projectsService.listProjectMembers(this.parseId(id, 'project id'), user);
  }
}
