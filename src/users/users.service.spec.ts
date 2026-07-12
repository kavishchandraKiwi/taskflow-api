import { Test, TestingModule } from '@nestjs/testing';
import { TestBed } from '@suites/unit';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersController } from './users.controller';
import { jest } from '@jest/globals'

describe('UsersService', () => {
  let usersService: UsersService;
  let databaseService: DatabaseService;
  
  beforeEach(async () => {   
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: {
            getPool: jest.fn().mockReturnValue({
              query: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () =>{
    expect(usersService).toBeDefined();
  })
  describe('checkExistingEmails', () => {
    it('should return user data if email exists in the database',async() => {
      const mockUserData = { user_id: 1, email: 'existinguser@test.com', username: 'existinguser'};
      jest.spyOn(databaseService.getPool(), 'query').mockResolvedValue({ rows: [mockUserData] });
      
      const result = usersService.checkExistingEmails(mockUserData.email);
      expect(databaseService.getPool().query).toHaveBeenCalledWith('SELECT user_id, email, username FROM users WHERE email=$1', ['existinguser@test.com']);
      
      expect(result).resolves.toEqual(mockUserData);
    });

    it('return null when email doesnt exist in the database', async() => {
      const mockUserData = {user_id: 1, email: 'existinguser@test.com', username: 'existinguser'};
      
      jest.spyOn(databaseService.getPool(), 'query').mockResolvedValue({rows: []});

      const result = usersService.checkExistingEmails(mockUserData.email);
      expect(databaseService.getPool().query).toHaveBeenCalledWith('SELECT user_id, email, username FROM users WHERE email=$1', ['existinguser@test.com']);
      expect(result).resolves.toEqual(null);
      
    });
  });
  
  describe('createUser', () => {
    it('should make a new user if input email does not exist in the database', async() => {
      const mockUserData : RegisterUserDto = {email: 'newuser@test.com', username: 'newuser', password: 'hashed_password'};
      const mockCreatedUser = {user_id: 1, email: 'newuser@test.com', username: 'newuser', time_created: new Date()};
      jest.spyOn(usersService, 'checkExistingEmails').mockResolvedValue(null);
      jest.spyOn(databaseService.getPool(), 'query').mockResolvedValue({rows: [mockCreatedUser]});
      if(!usersService.checkExistingEmails(mockUserData.email)){
        const result = await usersService.createUser(mockUserData);
        expect(databaseService.getPool().query).toHaveBeenCalledWith(
          `
          INSERT INTO users (
              email,
              username,
              time_created,
              password
          ) VALUES ($1, $2, NOW(), $3)
          RETURNING user_id, email, username, time_created
          `,
          [mockUserData.email, mockUserData.username, mockUserData.password]
      );
        expect(result).toEqual(mockCreatedUser);
      }
      

      
    });
    it('should throw a conflict exception if user input email already exists in the database', async() => {
      const mockUserData : RegisterUserDto = {email: 'existinguser@test.com', username: 'existinguser', password: 'hashed_password'};
      jest.spyOn(usersService, 'checkExistingEmails').mockResolvedValue({ user_id: 1, email: 'existinguser@test.com', username: 'existinguser' });

      if(await usersService.checkExistingEmails(mockUserData.email)){
        await expect(usersService.createUser(mockUserData)).rejects.toThrowError('account already exists with this email');
      }
    });
  });
});