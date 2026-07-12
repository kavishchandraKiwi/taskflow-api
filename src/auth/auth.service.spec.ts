import { TestingModule, Test } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginDto } from "./dto/login.dto";
import {jest} from '@jest/globals';

jest.mock('bcryptjs', () => ({
    compareSync: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let configService: ConfigService;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            checkExistingEmails: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  })

    it('should be defined', () => {
        expect(authService).toBeDefined();
    })
    describe('login', () => {
        it('should throw UnauthorizedException if user does not exist', async () => {
            const credentials: LoginDto = { email: 'nonexistent@test.com', password: 'password' };
            jest.spyOn(usersService, 'checkExistingEmails').mockResolvedValue(null);
            await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password is incorrect', async () => {
            const credentials: LoginDto = { email: 'test@test.com', password: 'wrongpassword' };
            const mockUser = { user_id: 1, email: 'test@test.com',username: 'testuser', password: 'hashed_password' };
            jest.spyOn(usersService, 'checkExistingEmails').mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);
            await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedException);    

        })

        it('should return valid JWT  token if credentials are valid', async () => {
            const credentials: LoginDto = { email: 'test@test.com', password: 'correctpassword' };
            const mockUser = { user_id: 1, email: 'test@test.com',username: 'testuser', password: 'hashed_password' };
            jest.spyOn(usersService, 'checkExistingEmails').mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);


            jest.spyOn(configService, 'get').mockImplementation((key: string) => {
                if (key === 'JWT_SECRET') return 'test-secret';
                if (key === 'JWT_EXPIRES_IN') return '1h';
                return null;
            });


            jest.spyOn(jwt, 'sign').mockReturnValue('validJWTToken');

            const result = await authService.login(credentials); 
            
            expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
            expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRES_IN');

            expect(jwt.sign).toHaveBeenCalledWith(
                { user_id: mockUser.user_id, email: mockUser.email },
                'test-secret',
                { expiresIn: '1h' }
            )
            
            expect(result).toEqual({ token: 'validJWTToken' });

        })
    });

})