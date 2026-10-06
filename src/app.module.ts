import { Module, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module.js';
import { PostsModule } from './modules/posts/posts.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { NewsModule } from './modules/news/news.module.js';
import { User } from './database/users/index.js';
import { Post } from './database/posts/index.js';
import { Comment } from './database/comments/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [User, Post, Comment],
        synchronize: false,
      }),
    }),
    UsersModule,
    PostsModule,
    CommentsModule,
    NewsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule { }
