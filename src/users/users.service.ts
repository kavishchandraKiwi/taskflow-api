import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database';


@Injectable()
export class UsersService {
    constructor(private databaseService: DatabaseService) {}

    async getUsers(){
        const res = await this.databaseService.getPool().query("SELECT * FROM users");
        return res;
    }
    
    async createUser(email: string,username: string,password_hashed:string){
        const result = await this.databaseService.getPool().query(
        `
        INSERT INTO users (
            email,
            user_name,
            time_created,
            password
        ) VALUES ($1, $2, NOW(), $3)
        RETURNING user_id,email, user_name, time_created
        `,
        [email, username, password_hashed]
    );
            
        return result.rows[0];
    }
    async checkExistingEmails(email:string){
        const result = await this.databaseService.getPool().query('SELECT * FROM users WHERE email=$1',[email]);
        if(result.rows.length === 0){
            return null;
        }
        return result.rows[0];
        
    }
}
