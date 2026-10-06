import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity.js';
import { CommentsRepository } from './comments.repository.js';

@Module({
    imports: [TypeOrmModule.forFeature([Comment])],
    providers: [CommentsRepository],
    exports: [CommentsRepository],
})
export class CommentsDbModule {}
