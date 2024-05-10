import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from '../schemas/user.schema';
import { SigninDto } from '../dto/signin.dto';
import { hashPassword } from '../services/hashPassword';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: mongoose.Model<User>,
    private jwtService: JwtService,
  ) {}

  async signin({ username, password }: SigninDto) {
    const user = await this.userModel.findOne(
      { username: username },
      'id username password role',
    );
    if (!user) return;
    if (user.password === (await hashPassword(password))) {
      const userData = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
      return this.jwtService.sign(userData);
    }
  }
}
