import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = { validateUser: jest.fn(), registerUserByEmail: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('rejects invalid credentials', async () => {
    authService.validateUser.mockResolvedValue(null);
    await expect(controller.login({ email: 'member@example.test', password: 'invalid' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });
});
