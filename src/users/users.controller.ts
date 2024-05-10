import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './services/users.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { Response } from 'express';
import { SigninDto } from './dto/signin.dto';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { VoteDto } from './dto/vote.dto';
import { VoteService } from './services/vote.service';
import { UserDecorator } from './decorators/user.decorator';
import { AvatarDto } from './dto/avatarUpload.dto';
import { AwsService } from './services/aws.service';

@Controller('api/users')
export class UsersController {
  constructor(
    private authService: AuthService,
    private usersServise: UsersService,
    private voteService: VoteService,
    private awsService: AwsService,
  ) {}

  @Get()
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 4,
  ): Promise<User[]> {
    return this.usersServise.findAll(page, perPage);
  }

  @Get(':id')
  async findOne(
    @Param('id')
    id: string,
    @Res() res: Response,
  ) {
    const user: any = await this.usersServise.findOneById(id);
    res.set('Last-Modified', user.updatedAt).send(user);
  }

  @Post('signup')
  async createUser(
    @Body()
    user: CreateUserDto,
  ): Promise<User> {
    return this.usersServise.create(user);
  }

  @Post('signin')
  async signin(
    @Body()
    signinDto: SigninDto,
    @Res() res: Response,
  ) {
    const token = await this.authService.signin(signinDto);
    res
      .set('Authorization', 'Bearer ' + token)
      .status(200)
      .send();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ): Promise<User> {
    return this.usersServise.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.usersServise.delete(id);
  }

  @Post('vote')
  @UseGuards(JwtAuthGuard)
  async vote(@Body() voteDto: VoteDto, @UserDecorator() user) {
    if (user.id == voteDto.targetUser)
      throw new HttpException('You cannot vote for yourself', 400);
    if ((await this.voteService.canVote(user.id)) == false)
      return new HttpException('You can vote once per hour', 429);
    return await this.voteService.vote(
      user.id,
      voteDto.targetUser,
      voteDto.voteType,
    );
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  async getLink(@Body() avatarDto: AvatarDto, @UserDecorator() user) {
    return this.awsService.getPresignedURL(user.id, avatarDto.fileName);
  }
}
