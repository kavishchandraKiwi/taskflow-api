import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database';
import { RegisterUserDto } from './dto/register-user.dto';


@Injectable()
export class UsersService {
    constructor(private databaseService: DatabaseService) {}

    
    
    async createUser(newUserData: RegisterUserDto){
        const checkIfEmailExists = await this.checkExistingEmails(newUserData.email);
        if(checkIfEmailExists!=null) throw new ConflictException('account already exists with this email');
        const result = await this.databaseService.getPool().query(
        `
        INSERT INTO users (
            email,
            username,
            time_created,
            password
        ) VALUES ($1, $2, NOW(), $3)
        RETURNING user_id, email, username, time_created
        `,
        [newUserData.email, newUserData.username, newUserData.password]
    );
            
        return result.rows[0];
    }
    async checkExistingEmails(email:string){
        const result = await this.databaseService.getPool().query('SELECT user_id, email, username, password FROM users WHERE email=$1',[email]);
        if(result.rows.length === 0){
            return null;
        }
        return result.rows[0];
        
    }
}
