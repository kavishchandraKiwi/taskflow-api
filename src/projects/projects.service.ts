import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database';
import { createProjectDto } from './dto/createProject';
import { ConfigService } from '@nestjs/config';

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
    
    async createProject(newProjectDto: createProjectDto, user: { user_id: number }) {
        //check if user already has project with same name
        const { project_name, project_description } = newProjectDto;
        const check = await this.databaseService.getPool().query(
            `
                SELECT project_id FROM projects
                WHERE owner_user_id = $1 AND project_name = $2
            `, [user.user_id, project_name],
        );
        if (check.rowCount > 0) {
            throw new ConflictException('you already own a project by the same name');
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

}

