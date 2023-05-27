import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberService } from 'src/member/member.service';
import { Auth, AuthDocument, AuthToken, JWT_CONSTANTS } from './auth.schema';
import { AuthService } from './auth.service';

import { Member } from 'src/member/member.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthImplService implements AuthService {
    async validateUser(email: string, password: string): Promise<AuthToken> {
        const member: Member = await this.memberSvc.getMemberByEmail(email);

        if(!member) {
            return null;
        }

        const { _id } = member;

        const authObj = await this.authModel.findOne({ uuid: _id }).exec();
        const isMatch = await bcrypt.compare(password, authObj.password);

        if(!isMatch) {
            return null;
        }
        
        return {
            access_token: this.jwtSvc.sign(JSON.parse(JSON.stringify(member)), {
                expiresIn: JWT_CONSTANTS.expiresIn,
                secret: JWT_CONSTANTS.secret
            })
        };
    }

    async registerUserByEmail(email: string, password: string, name: string): Promise<Member> {
        const member = await this.memberSvc.getMemberByEmail(email);

        if(member) {
            return null;
        }

        const newMember = await this.memberSvc.createMember({
            email: email,
            name,
            userName: email,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Member);


        const encryptedPass = await this.encryptPassword(password);

        await this.authModel.create({
            uuid: newMember._id,
            password: encryptedPass
        });

        return newMember;
    }

    protected async encryptPassword(password: string): Promise<string> {
        const saltOrRounds = JWT_CONSTANTS.saltOrRounds;
        const hash = await bcrypt.hash(password, saltOrRounds);
        return hash;
    }

    constructor(private memberSvc: MemberService, 
                @InjectModel(Auth.name) private readonly authModel: Model<AuthDocument>,
                private jwtSvc: JwtService) {}
}
