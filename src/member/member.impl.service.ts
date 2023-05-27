import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Member, MemberDocument } from 'src/member/member.schema';
import { MemberService } from 'src/member/member.service';

@Injectable()
export class MemberImplService implements MemberService {
    async getAllMembers(): Promise<Member[]> {
        return this.memberModel.find({});
    }

    async getMember(memberId: string): Promise<Member> {
        if(!isValidObjectId(memberId)) {
            return null;
        }

        return this.memberModel.findById(memberId).exec();
    }

    async getMemberByEmail(email: string): Promise<Member> {
        const memberObj: Member = await this.memberModel.findOne({ email: email }).exec();

        if(!memberObj) {
            return null;
        }

        return memberObj;
    };

    async createMember(memberObj: Member): Promise<Member> {
        memberObj.createdAt = new Date();
        memberObj.updatedAt = new Date();
        return this.memberModel.create(memberObj);
    }

    async updateMember(memberId: string, memberObj: Member): Promise<Member> {
        await this.memberModel.findByIdAndUpdate(memberId, memberObj);
        return this.getMember(memberId);
    }

    async deleteMember(memberId: string): Promise<Member> {
        return this.memberModel.findByIdAndDelete(memberId);
    }

    constructor(@InjectModel(Member.name) private readonly memberModel: Model<MemberDocument>) {}
}
