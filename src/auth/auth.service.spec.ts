import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';
import {ModuleMocker, MockMetadata} from 'jest-mock';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

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
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

      
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_EXPIRES_IN') return '1h';
        return undefined;
      });

      
      (jwt.sign as unknown as jest.Mock).mockReturnValue('signed-token');

        
        (bcrypt.compareSync as unknown as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  //1         
  it('should be defined', () => {
    expect(service).toBeDefined(); 

  });

  describe('login', () => {
    
    it('should return token upon succesful login', async () => {
      const mockUser = { user_id: 1, email: 'test@gmail.com', password: 'test' };
      usersService.checkExistingEmails.mockResolvedValue(mockUser);
      const credentials: LoginDto = { email: 'test@gmail.com', password: 'test' };
      const result = await service.login(credentials);
      expect(result).toHaveProperty('token');
    });

    it('should return error if user does not exist', async () => {
      usersService.checkExistingEmails.mockResolvedValue(null);
      const credentials: LoginDto = { email: 'nonexistent@gmail.com', password: 'doesitevenmatter??' };
      const result = await service.login(credentials);
      expect(result).toEqual('error: User doesnt exist');
    });

    it('should return error if password is incorrect', async () => {
      const mockUser = { user_id: 1, email: 'test@gmail.com', password: 'iknowthispasswordiswrong' };
      usersService.checkExistingEmails.mockResolvedValue(mockUser);
      (bcrypt.compareSync as unknown as jest.Mock).mockReturnValue(false);
      const credentials: LoginDto = { email: 'test@gmail.com', password: 'iknowthispasswordiswrong' };
      const result = await service.login(credentials);
      expect(result).toEqual({ error: 'Incorrect password' });
    });
  });
});