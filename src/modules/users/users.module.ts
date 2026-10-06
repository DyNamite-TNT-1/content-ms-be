import { Module } from '@nestjs/common';
import { UsersDbModule } from '../../database/users/index.js';
import { UsersController } from './controllers/index.js';
import { UsersService } from './services/index.js';
import { PostsDbModule } from '../../database/posts/index.js';

@Module({
  imports: [UsersDbModule, PostsDbModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
