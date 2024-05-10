import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { IfUserExistMiddleware } from './middlewares/if-user-exist.middleware';
import { IfUnmodifiedSinceMiddleware } from './middlewares/if-unmodified-since.middleware';
import { AuthService } from './auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { VoteSchema } from './schemas/vote.schema';
import { VoteService } from './services/vote.service';
import { UpdateUsersRating } from './scheduledTasks/updateUsersRating';
import { AwsService } from './services/aws.service';
import { UpdateUsersAvatarUrl } from './scheduledTasks/updateUsersAvatarUrl';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Vote', schema: VoteSchema },
    ]),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthService,
    JwtStrategy,
    VoteService,
    UpdateUsersRating,
    UpdateUsersAvatarUrl,
    AwsService,
  ],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IfUserExistMiddleware)
      .forRoutes(
        { path: 'api/users/:id', method: RequestMethod.GET },
        { path: 'api/users/:id', method: RequestMethod.PUT },
      );
    consumer
      .apply(IfUnmodifiedSinceMiddleware)
      .forRoutes({ path: 'api/users/:id', method: RequestMethod.PUT });
  }
}
