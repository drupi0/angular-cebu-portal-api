import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Member } from './member.schema';
import { MemberService } from './member.service';
import { TokenGuard } from 'src/auth/auth.guard';

@Controller('member')
export class MemberController {
    
    @UseGuards(TokenGuard)
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

    @UseGuards(TokenGuard)
    @Patch(":memberId")
    async updateEvent(@Param('memberId') memberId: string, @Body() memberObj: Member): Promise<Member> {
        return await this.memberSvc.updateMember(memberId, memberObj);
    }

    constructor(private memberSvc: MemberService){}
}