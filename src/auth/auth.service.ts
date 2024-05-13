import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { SignInDto } from './dto/signIn.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { HashService } from 'src/hash/hash.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: mongoose.Model<User>,
    private jwtService: JwtService,
    private hashService: HashService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.userModel.findOne({
      username: createUserDto.username,
    });
    if (user) {
      throw new HttpException('User with this username is already exist', 400);
    }
    const newUser = new this.userModel(createUserDto);
    return await newUser.save();
  }

  async signIn({ username, password }: SignInDto): Promise<string> {
    const user = await this.userModel.findOne(
      { username: username },
      'id username password role',
    );
    if (!user) return;
    if (user.password === (await this.hashService.hashPassword(password))) {
      const userData = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
      return this.jwtService.sign(userData);
    }
  }
}
