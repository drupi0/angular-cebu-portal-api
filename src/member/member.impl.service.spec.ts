import { Test, TestingModule } from '@nestjs/testing';
import { MemberImplService } from './member.impl.service';
import { getModelToken } from '@nestjs/mongoose';
import { Member } from './member.schema';

describe('MemberImplService', () => {
  let service: MemberImplService;
  const memberModel = { findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberImplService, { provide: getModelToken(Member.name), useValue: memberModel }],
    }).compile();

    service = module.get<MemberImplService>(MemberImplService);
  });

  it('rejects malformed identifiers without querying MongoDB', async () => {
    expect(await service.getMember('not-an-object-id')).toBeNull();
    expect(memberModel.findById).not.toHaveBeenCalled();
  });
});
