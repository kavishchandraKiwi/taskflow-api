import { Controller,Request, Body, Post, Get, Patch, UnauthorizedException, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { createProjectDto } from './dto/createProject';
import {Request as ExpressRequest} from 'express';
import { UpdateProjectdto } from './dto/updateProjectDto';



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

    @Patch('updatemyproject')
    async updateProject(@Body() updateProjectDto: UpdateProjectdto, 
    @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.updateProject(updateProjectDto,req.user);

    }

    @Delete('deleteprojectwithname')
    async deleteProject(@Body() project_name: string, 
    @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.deleteProject(req.user, project_name);
    }
}
