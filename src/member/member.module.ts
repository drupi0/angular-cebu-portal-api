import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberImplService } from './member.impl.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberSchema } from './member.schema';

@Module({
  controllers: [MemberController],
  providers: [{ provide: MemberService, useClass: MemberImplService}],
  imports: [MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema}])],
  exports: [MemberService]
})
export class MemberModule {}