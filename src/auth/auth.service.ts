import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';


@Injectable()
export class AuthService{
    constructor(
        private usersService: UsersService,
        private configService: ConfigService,
    ){}

    async login(email: string, password: string) {
        const user = await this.usersService.checkExistingEmails(email); 
        if(!user) { throw new Error('User doesnt exist'); }

        const passwordCheck = bcrypt.compareSync(password, user.password);
        if(!passwordCheck) { throw new Error('Incorrect password'); }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            this.configService.get<string>('JWT_SECRET'),
            { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h' },
        );

        return { token };
    }
}