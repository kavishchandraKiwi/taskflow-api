import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService{
    constructor(
        private usersService: UsersService,
        private configService: ConfigService,
    ){}

    async login(credentials: LoginDto) {
        const user = await this.usersService.checkExistingEmails(credentials.email);
        if (!user) {
            return 'error: User doesnt exist';
        }

        const passwordCheck = bcrypt.compareSync(credentials.password, user.password);
        if(!passwordCheck) { 
            return { error: 'Incorrect password' };
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            this.configService.get<string>('JWT_SECRET'),
            { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h' },
        );

        return { token };
    }

    
}