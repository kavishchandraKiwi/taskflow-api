import { Controller,Request, Body, Post, Get, Patch, UnauthorizedException, Delete, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {Request as ExpressRequest} from 'express';
import { UpdateProjectDto } from './dto/update-project.dto';



@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService){}

    @Post()
    async createProject(@Body() createProjectDto: CreateProjectDto,
        @Request() req: ExpressRequest & {user?:{ user_id: number; email: string } },
    ){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }

        return this.projectsService.createProject(createProjectDto, req.user);
    }

    @Get()
    async listUserProjects( @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.listUserProjects(req.user);
    }

    @Patch(':id')
    async updateProject(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, 
    @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.updateProject(updateProjectDto,req.user, id);

    }

    @Delete(':id')
    async deleteProject(@Param('id') id: string, 
    @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.deleteProject(req.user, id);
    }

    @Post (':id/members')
    async addMemberToProject(@Param('id') id: string, @Body() body: {email: string}, 
    @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.addMemberToProject(id, body.email, req.user);
    }

    @Get(':id/members')
    async listProjectMembers(@Param('id') id: string, 
    @Request() req: ExpressRequest & {user?:{ user_id: number; email: string }}){
        if(!req.user?.user_id){
            throw new UnauthorizedException('user not authenticated')
        }
        return this.projectsService.listProjectMembers(id, req.user);
    }
}
