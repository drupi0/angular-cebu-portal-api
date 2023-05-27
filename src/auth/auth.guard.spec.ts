import { LocalGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('should be defined', () => {
    expect(new LocalGuard()).toBeDefined();
  });
});
