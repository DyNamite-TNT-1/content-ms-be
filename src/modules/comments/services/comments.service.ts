import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository, Comment } from '../../../database/comments/index.js';
import { PostsRepository } from '../../../database/posts/index.js';
import { UsersRepository } from '../../../database/users/index.js';
import { CreateCommentDto } from '../dto/create-comment.dto.js';
import { UpdateCommentDto } from '../dto/update-comment.dto.js';

@Injectable()
export class CommentsService {
    constructor(
        private readonly commentsRepo: CommentsRepository,
        private readonly postsRepo: PostsRepository,
        private readonly usersRepo: UsersRepository,
    ) {}

    async findByPost(postId: number): Promise<Comment[]> {
        const post = await this.postsRepo.findById(postId);
        if (!post) throw new NotFoundException(`Post #${postId} not found`);
        return this.commentsRepo.findByPost(postId);
    }

    async create(postId: number, dto: CreateCommentDto): Promise<Comment> {
        const post = await this.postsRepo.findById(postId);
        if (!post) throw new NotFoundException(`Post #${postId} not found`);

        const user = await this.usersRepo.findById(dto.userId);
        if (!user) throw new NotFoundException(`User #${dto.userId} not found`);

        return this.commentsRepo.save({ content: dto.content, post, user });
    }

    async update(postId: number, commentId: number, dto: UpdateCommentDto): Promise<Comment> {
        const comment = await this.findOneOrFail(postId, commentId);
        return this.commentsRepo.update(comment, dto);
    }

    async remove(postId: number, commentId: number): Promise<void> {
        const comment = await this.findOneOrFail(postId, commentId);
        await this.commentsRepo.remove(comment);
    }

    // Helper: tìm comment thuộc về đúng post, ném NotFoundException nếu không tồn tại
    private async findOneOrFail(postId: number, commentId: number): Promise<Comment> {
        const comment = await this.commentsRepo.findOneByPostAndId(postId, commentId);
        if (!comment) throw new NotFoundException(`Comment #${commentId} not found in Post #${postId}`);
        return comment;
    }
}
