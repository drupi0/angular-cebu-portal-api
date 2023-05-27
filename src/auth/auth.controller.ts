import { BadRequestException, Body, Controller, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthToken } from './auth.schema';
import { LocalGuard } from './auth.guard';
import { Member } from 'src/member/member.schema';

@Controller('auth')
export class AuthController {
    
    @Post("login")
    async login(@Body() requestBody: { email: string, password: string}): Promise<AuthToken> {
        const { email, password } = requestBody;
        console.log(requestBody);

        const tokenObj = await this.authSvc.validateUser(email, password); 

        if(!tokenObj) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return tokenObj;
    }

    @Post("register")
    async register(@Body() requestBody: { email: string, password: string, name: string}): Promise<Member> {
        const { email, password, name } = requestBody;
        const member = await this.authSvc.registerUserByEmail(email, password, name);

        console.log("this is member")
        console.log(member);

        if(!member) {
            throw new BadRequestException("User already exists");
        }

        return member;
    }

    constructor(private authSvc: AuthService){}
}
