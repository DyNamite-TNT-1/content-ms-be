import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository, Post } from '../../../database/posts/index.js';
import { UsersRepository } from '../../../database/users/index.js';
import { CreatePostDto } from '../dto/index.js';
import { UpdatePostDto } from '../dto/index.js';
import { BaseService } from '../../../common/base.service.js';

@Injectable()
export class PostsService extends BaseService<Post> {
  constructor(
    private readonly postsRepo: PostsRepository,
    private readonly usersRepo: UsersRepository,
  ) {
    super();
  }

  findAll(): Promise<Post[]> {
    return this.postsRepo.findAll();
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepo.findById(id);
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return post;
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const author = await this.usersRepo.findById(dto.authorId);
    if (!author) throw new NotFoundException(`User #${dto.authorId} not found`);
    return this.postsRepo.save({ ...dto, author });
  }

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    return this.postsRepo.update(post, dto);
  }

  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.postsRepo.remove(post);
  }

  async findAllByUser(authorId: number): Promise<Post[]> {
    const user = await this.usersRepo.findById(authorId);
    if (!user) throw new NotFoundException(`User #${authorId} not found`);
    return this.postsRepo.findAllByAuthorId(authorId);
  }
}
