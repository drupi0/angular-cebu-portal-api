import { Test, TestingModule } from '@nestjs/testing';
import { MemberImplService } from './member.impl.service';

describe('MemberImplService', () => {
  let service: MemberImplService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberImplService],
    }).compile();

    service = module.get<MemberImplService>(MemberImplService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
