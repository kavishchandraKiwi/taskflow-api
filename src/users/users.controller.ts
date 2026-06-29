import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController{
    constructor(
        private usersService : UsersService,
        private authService : AuthService
    ){}

    @Post('register')
    async register(@Body() body: any) {
        const hash = await bcrypt.hash(body.password, 10);
        return this.usersService.createUser(body.email, body.username, hash);
    }
    
    @Post('login')
    login(@Body() body:any){
        return this.authService.login(
            body.email,
            body.password);
}
}
