import { Test, TestingModule } from '@nestjs/testing';
import { AuthImplService } from './auth.impl.service';
import { MemberService } from '../member/member.service';
import { getModelToken } from '@nestjs/mongoose';
import { Auth } from './auth.schema';
import { JwtService } from '@nestjs/jwt';

describe('AuthImplService', () => {
  let service: AuthImplService;
  const memberService = { getMemberByEmail: jest.fn() };
  const authModel = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthImplService,
        { provide: MemberService, useValue: memberService },
        { provide: getModelToken(Auth.name), useValue: authModel },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthImplService>(AuthImplService);
  });

  it('does not issue a token for an unknown member', async () => {
    memberService.getMemberByEmail.mockResolvedValue(null);
    expect(await service.validateUser('unknown@example.test', 'invalid')).toBeNull();
    expect(authModel.findOne).not.toHaveBeenCalled();
  });
});
