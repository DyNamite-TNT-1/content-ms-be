import { Module } from '@nestjs/common';
import { PostsDbModule } from '../../database/posts/index.js';
import { UsersDbModule } from '../../database/users/index.js';
import { CommentsDbModule } from '../../database/comments/index.js';
import { PostsController } from './controllers/index.js';
import { PostsService } from './services/index.js';

@Module({
  imports: [PostsDbModule, UsersDbModule, CommentsDbModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
