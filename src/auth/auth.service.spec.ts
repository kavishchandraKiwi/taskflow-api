import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  const mockQuery = jest.fn();
  const mockDatabaseService = {
    getPool: jest.fn(() => ({
      query: mockQuery,
    
    })),
  
  
  };
  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'JWT_SECRET':
          return 'secret';
        case 'JWT_EXPIRES_IN':
          return '1h';
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('should login successfully and return JWT', async () => {
      const user = {
        user_id: 1,
        email: 'abc@test.com',
        password: 'hashed-password',
      };

      mockQuery.mockResolvedValue({
        rows: [user],
      });

      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await authService.login({
        email: 'abc@test.com',
        password: 'password123',
      });

      expect(result).toEqual({
        token: 'mock-jwt-token',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email=$1',
        ['abc@test.com'],
      );

      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user_id: 1,
          email: 'abc@test.com',
        },
        'secret',
        {
          expiresIn: '1h',
        },
      );
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
      });

      await expect(
        authService.login({
          email: 'abc@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compareSync).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            user_id: 1,
            email: 'abc@test.com',
            password: 'hashed-password',
          },
        ],
      });

      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(
        authService.login({
          email: 'abc@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});