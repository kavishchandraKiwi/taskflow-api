import { Controller, Post, Body } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';


@Controller('projects')
export class ProjectsController {
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return {
      message: 'Project created',
      payload: createProjectDto,
    };
  }
}
