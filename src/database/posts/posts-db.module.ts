import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity.js';
import { PostsRepository } from './posts.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  providers: [PostsRepository],
  exports: [PostsRepository],
})
export class PostsDbModule {}
