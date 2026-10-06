import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Comment } from './comment.entity.js';

@Injectable()
export class CommentsRepository {
    constructor(
        @InjectRepository(Comment)
        private readonly repo: Repository<Comment>,
    ) {}

    findByPost(postId: number): Promise<Comment[]> {
        return this.repo.find({ where: { post: { id: postId } } });
    }

    findOneByPostAndId(postId: number, commentId: number): Promise<Comment | null> {
        return this.repo.findOne({ where: { id: commentId, post: { id: postId } } });
    }

    save(data: DeepPartial<Comment>): Promise<Comment> {
        return this.repo.save(this.repo.create(data));
    }

    async update(comment: Comment, changes: DeepPartial<Comment>): Promise<Comment> {
        Object.assign(comment, changes);
        return this.repo.save(comment);
    }

    remove(comment: Comment): Promise<Comment> {
        return this.repo.remove(comment);
    }
}
