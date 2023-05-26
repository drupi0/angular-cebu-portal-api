import { Member } from "./member.schema";

export class MemberService {
    getAllMembers: () => Promise <Member[]>;
    getMember: (memberId: string) => Promise<Member>;
    createMember: (memberObj: Member) => Promise<Member>;
    updateMember: (memberId: string, memberObj: Member) => Promise<Member>;
    deleteMember: (memberId: string) => Promise<Member>;
}