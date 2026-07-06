import { Body, ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database';
import { CreateProjectDto } from './dto/create-project.dto';
import { ConfigService } from '@nestjs/config';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        private databaseService: DatabaseService,
        private configService: ConfigService
    ) { }

    async getProjects() {
        const res = await this.databaseService.getPool().query(
            `
            SELECT * FROM projects
            `
        );
        return res;
    }
    
    async createProject(createProjectDto: CreateProjectDto, user: { user_id: number }) {
        //check if user already has project with same name
        const { project_name, project_description } = createProjectDto;
        const check = await this.databaseService.getPool().query(
            `
                SELECT project_id FROM projects
                WHERE owner_user_id = $1 AND project_name = $2
            `, [user.user_id, project_name],
        );
        if (check.rowCount > 0) {
            throw new ConflictException('you already own a project by the same name bro');
        }
        const  projres = await this.databaseService.getPool().query(
            `
                INSERT INTO projects (project_name, description, owner_user_id)
                VALUES($1, $2, $3)
                RETURNING *`
            , [project_name, project_description, user.user_id]
        );

                const memres = await this.databaseService.getPool().query(
            `
                INSERT INTO projects_members(project_id, user_id)
                VALUES ($1, $2)
                RETURNING *`
            , [projres.rows[0].project_id, user.user_id]
        );
        
        return projres.rows[0];

    }
    async listUserProjects(user: {user_id:number}){
        const res = await this.databaseService.getPool().query(
            `
                SELECT * FROM projects WHERE owner_user_id = $1

            `,[user.user_id]
        );
        return res.rows;
    }

    async updateProject(updateProjectDto: UpdateProjectDto, user:{user_id}){
        const res = await this.databaseService.getPool().query(
            `
            UPDATE projects
            SET description = $1
            WHERE owner_user_id = $2
            

            `,[updateProjectDto.updated_description, user.user_id]
        );

        return {"message": "project updated"};
    }

    async deleteProject(user:{user_id}, id: string){
        const exists = await this.databaseService.getPool().query(
            `
            SELECT EXISTS(
                SELECT 1
                FROM projects
                WHERE project_name = $1 
                        AND owner_user_id = $2)
            `, [id, user.user_id]
        )
        if(exists) return {"message": "bro you dont have a project with that name"};
        else{
            const res = await this.databaseService.getPool().query(
                `
                DELETE FROM projects WHERE owner_user_id = $1 AND project_name = $2
                `,[user.user_id, id]
            )
            return {"message": "project deleted"};
    }
    }

}

