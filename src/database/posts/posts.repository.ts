import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Post } from './post.entity.js';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repo: Repository<Post>,
  ) {}

  findAll(): Promise<Post[]> {
    return this.repo.find();
  }

  findById(id: number): Promise<Post | null> {
    return this.repo.findOne({ where: { id } });
  }

  findAllByAuthorId(authorId: number): Promise<Post[]> {
    return this.repo.find({
      where: { author: { id: authorId } },
      order: { createdAt: 'DESC' },
    });
  }

  save(data: DeepPartial<Post>): Promise<Post> {
    return this.repo.save(this.repo.create(data));
  }

  async update(post: Post, changes: DeepPartial<Post>): Promise<Post> {
    Object.assign(post, changes);
    return this.repo.save(post);
  }

  remove(post: Post): Promise<Post> {
    return this.repo.remove(post);
  }
}
