
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import e from 'express';
import * as mongoose from 'mongoose';

export type MemberDocument = mongoose.HydratedDocument<Member>;
export enum MemberRoles {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

@Schema()
export class Member {
  
  _id!: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  userName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop()
  uuid: string;

  @Prop()
  isEmailValidated: boolean;

  @Prop()
  eventsAttended: {
    eventId: string,
    hasAttended: boolean,
    answers: {
        index: number,
        answer: string
    }[]
  }[];

  @Prop()
  roles: MemberRoles[];
}

export const MemberSchema = SchemaFactory.createForClass(Member);
