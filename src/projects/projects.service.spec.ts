import {BadRequestException,ConflictException,ForbiddenException,
  Injectable,NotFoundException,} from '@nestjs/common';
import { DatabaseService } from '../database/database';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { TestBed } from '@suites/unit';
import {Test, TestingModule} from '@nestjs/testing';

describe('ProjectsService', () => {
  let projectsService: ProjectsService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: DatabaseService,
          useValue: {
            getPool: jest.fn().mockReturnValue({
              query: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    projectsService = module.get<ProjectsService>(ProjectsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(projectsService).toBeDefined();
  });

  describe('createProject',() => {
    it('should throw bad request error if prject name does not exist', async() => {
      const createProjectDto: CreateProjectDto = { project_name: '', description: 'Test project' };
      const user = { user_id: 1 };

      await expect(projectsService.createProject(createProjectDto, user)).rejects.toThrow(BadRequestException);
    })
    it('should throw conflict error if user already owns a project by this name', async() => {
      const createProjectDto: CreateProjectDto = { project_name: 'Test Project', description: 'Test project' };
      const user = { user_id: 1 };

      jest.spyOn(databaseService.getPool(), 'query').mockResolvedValue({ rowCount: 1 });
      

      await expect(projectsService.createProject(createProjectDto, user)).rejects.toThrow(ConflictException);
    })

    
  } )

  
})
