import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from '../auth/dto/login.dto';

@Controller('users')
export class UsersController{
    constructor(
        private usersService : UsersService,
        private authService : AuthService
    ){}

    @Post('register')
    async register(@Body() body: RegisterUserDto) {
        const hash = await bcrypt.hash(body.password, 10);
        body.password = hash;
        return this.usersService.createUser(body);
    }

    @Post('login')
    login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }
}
