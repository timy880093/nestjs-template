import { Test, TestingModule } from '@nestjs/testing';
import { UserDto } from '../../../apps/new-project-template/src/modules/users/dto/user.dto';
import { AuthService } from './auth.service';
import { UsersService } from '../../../apps/new-project-template/src/modules/users/users.service';
import { LineService } from './line.service';
import { TokenRes } from './dto/token.res';

describe('LineService', () => {
  let service: LineService;
  let usersService: UsersService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineService,
        {
          provide: UsersService,
          useValue: {
            findOneByLineUid: jest.fn(),
            findOneByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LineService>(LineService);
    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  describe('signInOrSignUp', () => {
    it('should sign in existing user by Line UID', async () => {
      const mockProfile = { email: 'test@example.com', sub: '12345' };
      const mockUserDto = new UserDto({
        email: mockProfile.email,
        lineUid: mockProfile.sub,
      });
      jest
        .spyOn(usersService, 'findOneByLineUid')
        .mockResolvedValueOnce(mockUserDto);
      jest
        .spyOn(usersService, 'findOneLikeEmail')
        .mockResolvedValueOnce(mockUserDto);
      jest.spyOn(usersService, 'create').mockResolvedValueOnce(mockUserDto);
      jest
        .spyOn(authService, 'signIn')
        .mockResolvedValueOnce(TokenRes.create('new-jwt-token', '7d'));

      const result = await service.lineAuth({
        email: mockProfile.email,
        userId: mockProfile.sub,
      });

      console.log('result', result);
      expect(usersService.findOneByLineUid).toHaveBeenCalledWith(
        mockProfile.sub,
      );
      expect(authService.signIn).toHaveBeenCalledWith(mockUserDto);
      expect(result).toEqual({ token: 'jwt-token' });
    });

    // it('should create a new user if no user found', async () => {
    //   const mockProfile = { email: 'newuser@example.com', sub: '54321' };
    //   const newUserDto = new UserDto({
    //     email: mockProfile.email,
    //     lineUid: mockProfile.sub,
    //   });
    //   jest.spyOn(usersService, 'findOneByLineUid').mockResolvedValueOnce(null);
    //   jest.spyOn(usersService, 'findOneByEmail').mockResolvedValueOnce(null);
    //   jest.spyOn(usersService, 'create').mockResolvedValueOnce(newUserDto);
    //   jest
    //     .spyOn(authService, 'signIn')
    //     .mockResolvedValueOnce(TokenResponseDto.create('new-jwt-token', '7d'));
    //
    //   const result = await service.signInOrSignUp(mockProfile);
    //
    //   expect(usersService.findOneByLineUid).toHaveBeenCalledWith(
    //     mockProfile.sub,
    //   );
    //   expect(usersService.findOneByEmail).toHaveBeenCalledWith(
    //     mockProfile.email,
    //   );
    //   expect(usersService.create).toHaveBeenCalledWith({
    //     email: mockProfile.email,
    //     lineUid: mockProfile.sub,
    //   });
    //   expect(authService.signIn).toHaveBeenCalledWith(newUserDto);
    //   expect(result).toEqual({ token: 'new-jwt-token' });
    // });
    //
    // it('should handle errors and create a new user in the catch block', async () => {
    //   const mockProfile = { email: 'erroruser@example.com', sub: '99999' };
    //   const mockError = new Error('Some error');
    //   const newUserDto = new UserDto({
    //     email: mockProfile.email,
    //     lineUid: mockProfile.sub,
    //   });
    //   jest
    //     .spyOn(usersService, 'findOneByLineUid')
    //     .mockRejectedValueOnce(mockError);
    //   jest.spyOn(usersService, 'create').mockResolvedValueOnce(newUserDto);
    //   jest
    //     .spyOn(authService, 'signIn')
    //     .mockResolvedValueOnce(TokenResponseDto.create('new-jwt-token', '7d'));
    //
    //   const result = await service.signInOrSignUp(mockProfile);
    //
    //   expect(usersService.create).toHaveBeenCalledWith(newUserDto);
    //   expect(authService.signIn).toHaveBeenCalledWith(newUserDto);
    //   expect(result).toEqual({ token: 'error-jwt-token' });
    // });
  });
});
