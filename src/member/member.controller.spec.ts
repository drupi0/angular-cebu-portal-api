import { Test, TestingModule } from '@nestjs/testing';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { NotFoundException } from '@nestjs/common';

describe('MemberController', () => {
  let controller: MemberController;
  const memberService = { getMember: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberController],
      providers: [{ provide: MemberService, useValue: memberService }],
    }).compile();

    controller = module.get<MemberController>(MemberController);
  });

  it('reports a missing member as not found', async () => {
    memberService.getMember.mockResolvedValue(null);
    await expect(controller.getMemberById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
