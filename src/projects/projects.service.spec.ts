import {BadRequestException,ConflictException,ForbiddenException,
  Injectable,NotFoundException,} from '@nestjs/common';
import { DatabaseService } from '../database/database';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import {Test, TestingModule} from '@nestjs/testing';
import { mock } from 'node:test';

describe('ProjectsService', () => {
  let projectsService: ProjectsService;
  let databaseService : DatabaseService;
  

  const mockQuery = jest.fn();
  const mockDatabaseService = {
    getPool : jest.fn(() => ({
      query : mockQuery,
    }))
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService
        },
      ]
    }).compile();

    projectsService = module.get<ProjectsService>(ProjectsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    jest.clearAllMocks();
  })
  it('should be defined', () => {
    expect(projectsService).toBeDefined();
  })
  describe('createProject', () => {
    it('should create a new project', async() => {
      
      const createProjectDto: CreateProjectDto  = {
        project_name: "test project",
        description: "this is a test project",
        deadline: '2026-08-01'
      }
      const user = {user_id: 1};

      //db is bein queried hrice 1. check existing projects 2. insert 3.insert
      mockQuery.mockResolvedValueOnce({rows: []});
      mockQuery.mockResolvedValueOnce({rows: [
        {
          project_id: 100,
          project_name: "test project",
          description: "this is a test project",
          deadline: '2026-08-01',
          owner_user_id: 1,
        }
      ]})
      mockQuery.mockResolvedValueOnce({rows: []});

      const result = await projectsService.createProject(createProjectDto, user);
      expect(result).toEqual({
        project_id: 100,
        project_name: "test project",
        description: "this is a test project",
        deadline: '2026-08-01',
        owner_user_id: user.user_id,
      })
      expect(mockQuery).toHaveBeenCalledTimes(3);

    })

    it('should raise conflict exception if user already owns a project by the same name', async() => {
      const createProjectDto: CreateProjectDto  = {
        project_name: "existing project",
        description: "this is an existing project",
        deadline: '2026-08-01'
      }
      const user = {user_id: 1};
      mockQuery.mockResolvedValueOnce({rowCount : 1, rows: [{project_id: 50}]});
      

      await expect(projectsService.createProject(createProjectDto,user)).rejects.toThrow(ConflictException);
      expect(mockQuery).toHaveBeenCalledWith(
      'SELECT 1 FROM projects WHERE owner_user_id = $1 AND project_name = $2',[user.user_id, 'existing project']);
      expect(mockQuery).toHaveBeenCalledTimes(1);

    })

  })
  describe('getProjectById',  ()=> {

    const project_id = 100; //project may or may not exist
    const user = {user_id: 1}; 
    it('should throw project not found exception if project DNE OR USER DOESNT HAVE ACCESS TO PROJECT',async() => {
      mockQuery.mockResolvedValueOnce({rowCount: 0, rows: []});
      
      await expect(projectsService.getProjectById(project_id, user)).rejects.toThrow(NotFoundException);
      expect(mockQuery).toHaveBeenCalledWith('SELECT 1 FROM projects_members WHERE project_id = $1 AND user_id = $2', [100, user.user_id]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    })
    it('should return project if project exists and user is a memberr', async () => {
      mockQuery.mockResolvedValueOnce({rowCount: 1, rows: [
       { project_id: 100, }
      ]})
      mockQuery.mockResolvedValueOnce({rowCount: 1, rows: [
        {
          project_id: 100,
          project_name: " existing project",
          description: "this is an existing project",
          deadline: '2026-08-01',
          owner_user_id: 60,
        }
      ]})
      const result =  await projectsService.getProjectById(project_id, user);
      expect(result).toEqual({
        project_id: 100,
        project_name: " existing project",
        description: "this is an existing project",
        deadline: '2026-08-01',
        owner_user_id: 60,
      })
      expect(mockQuery).toHaveBeenCalledTimes(2);

    });
  })

  describe('updateProject',() => {
    it('should update the project successfully happy path', async() => {
      const user = {user_id: 1};
      const project_id = 10;
      const updateProjectDto: UpdateProjectDto = {
        project_name: 'Updated Project',
        description: 'Updated Description',
        deadline: '2026-12-31',
      }
      mockQuery.mockResolvedValueOnce({rowCount : 1, rows: [
        {
          owner_user_id : 1,
        }
      ]})
      mockQuery.mockResolvedValueOnce({rowCount: 1, rows : [
        {
          project_id: 10,
          project_name: 'Updated Project',
          description: 'Updated Description',
          deadline: '2026-12-31',
          owner_user_id: 1,
        }

      ]})
      const result = await projectsService.updateProject(project_id,updateProjectDto, user);
      expect(result).toEqual({
        project_id: 10,
        project_name: 'Updated Project',
        description: 'Updated Description',
        deadline: '2026-12-31',
        owner_user_id: 1,
      });
      expect(mockQuery).toHaveBeenCalledTimes(2);


    })
    it('should throw NotFoundException if project DNE or user is not a member', async () => {

      mockQuery.mockResolvedValueOnce({rowCount: 0,rows: []});

      await expect(
        projectsService.updateProject(10, {project_name: 'Updated',},{user_id: 1,},
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
    it('should throw ForbiddenException if user is not project owner', async () => {

      mockQuery.mockResolvedValueOnce({rowCount: 1,rows: [
          {
            owner_user_id: 20,},
        ],
      });

      await expect(
        projectsService.updateProject(
          10,
          {project_name: 'Updated',},
          {user_id: 1},
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
    it('should return the current project only if the updateProjectDto body is empty ', async() => {
      const project_id = 100;
      const user = {user_id : 10};
      const currentProject = {
        project_id: 10,
        project_name: 'current project',
        description: 'this is a project that is existing currently',
        deadline: '2026-12-31',
        owner_user_id: 1,
      }

      const updateProjectDto: UpdateProjectDto = {};

      mockQuery.mockResolvedValueOnce({rowCount: 1, rows: [
        {owner_user_id: 1}
      ]});
      


      
      


    })
    

    

  })

})