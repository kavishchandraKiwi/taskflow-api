import { Controller,Request, Body, Post, Get, Patch, UnauthorizedException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { createProjectDto } from './dto/createProject';
import {Request as ExpressRequest} from 'express';



@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService){}

    @Post('createproject')
    async createProject(@Body() newProjectDto: createProjectDto,
        @Request() req: ExpressRequest & {user?:{ user_id: number; email: string } },
    ){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }

        return this.projectsService.createProject(newProjectDto, req.user);
    }

    @Post('seemyprojects')
    async listUserProjects( @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.listUserProjects(req.user);
    }
}
