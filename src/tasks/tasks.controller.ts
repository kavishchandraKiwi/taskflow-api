import { BadRequestException, Body, Controller, Delete, Get, Param, 
    Patch, Post, Request, UnauthorizedException
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";


//tasks is only accessible through a project

@Controller('projects')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

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

  
}
