import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../../database/users/index.js';
import { User } from '../../../database/users/index.js';
import { CreateUserDto } from '../dto/index.js';
import { Post, PostsRepository } from '../../../database/posts/index.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly postsRepo: PostsRepository,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepo.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`Email "${dto.email}" đã được sử dụng`);
    }
    return this.usersRepo.save(dto);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);
    return this.usersRepo.remove(user);
  }

  async findPostsByUser(userId: number): Promise<Post[]> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    return this.postsRepo.findAllByAuthorId(userId);
  }
}
