import { Member } from "src/member/member.schema";
import { AuthToken } from "./auth.schema";

export class AuthService {
    validateUser: (email: string, password: string) => Promise<AuthToken>;
    registerUserByEmail: (email: string, password: string, name: string) => Promise<Member>;
}
