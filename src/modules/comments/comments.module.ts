import { Module } from '@nestjs/common';
import { CommentsDbModule } from '../../database/comments/index.js';
import { PostsDbModule } from '../../database/posts/index.js';
import { UsersDbModule } from '../../database/users/index.js';
import { CommentsController } from './controllers/index.js';
import { CommentsService } from './services/index.js';

@Module({
    imports: [CommentsDbModule, PostsDbModule, UsersDbModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
