import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Member } from './member.schema';
import { MemberService } from './member.service';

@Controller('member')
export class MemberController {
    
    @Get(":memberId")
    async getMemberById(@Param('memberId') memberId: string): Promise<Member> {

        const memberObj = await this.memberSvc.getMember(memberId);

        if(!memberObj) {
            throw new NotFoundException(`${memberId} not found`);
        }

        return memberObj;
    }

    @Post("create")
    async createMember(@Body() eventObj: Member): Promise<Member> {
        return await this.memberSvc.createMember(eventObj);
    }

    @Patch(":memberId")
    async updateEvent(@Param('memberId') memberId: string, @Body() memberObj: Member): Promise<Member> {
        return await this.memberSvc.updateMember(memberId, memberObj);
    }

    constructor(private memberSvc: MemberService){}
}
