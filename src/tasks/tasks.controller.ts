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

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('projects')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  private getAuthenticatedUser(
    req: ExpressRequest & { user?: { user_id: number; email: string } },
  ) {
    if (!req.user?.user_id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return req.user;
  }

  private parseId(value: string, field: string): number {
    const id = Number(value);

    if (!Number.isInteger(id)) {
      throw new BadRequestException(`${field} must be a valid integer`);
    }

    return id;
  }

  @Post(':projectId/tasks')
  async createTask(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: ExpressRequest & {
      user?: { user_id: number; email: string };
    },
  ) {
    return this.tasksService.createTask(
      this.parseId(projectId, 'project id'),
      createTaskDto,
      this.getAuthenticatedUser(req),
    );
  }

  @Get(':projectId/tasks')
  async listTasks(
    @Param('projectId') projectId: string,
    @Request() req: ExpressRequest & {
      user?: { user_id: number; email: string };
    },
  ) {
    return this.tasksService.listTasks(
      this.parseId(projectId, 'project id'),
      this.getAuthenticatedUser(req),
    );
  }

  @Get(':projectId/tasks/:taskId')
  async getTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Request() req: ExpressRequest & {
      user?: { user_id: number; email: string };
    },
  ) {
    return this.tasksService.getTask(
      this.parseId(projectId, 'project id'),
      this.parseId(taskId, 'task id'),
      this.getAuthenticatedUser(req),
    );
  }

  @Patch(':projectId/tasks/:taskId')
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: ExpressRequest & {
      user?: { user_id: number; email: string };
    },
  ) {
    return this.tasksService.updateTask(
      this.parseId(projectId, 'project id'),
      this.parseId(taskId, 'task id'),
      updateTaskDto,
      this.getAuthenticatedUser(req),
    );
  }

  
}