import { Test, TestingModule } from '@nestjs/testing';
import { AuthImplService } from './auth.impl.service';

describe('AuthImplService', () => {
  let service: AuthImplService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthImplService],
    }).compile();

    service = module.get<AuthImplService>(AuthImplService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
