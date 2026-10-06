import { Module } from '@nestjs/common';
import { UsersDbModule } from '../../database/users/index.js';
import { UsersController } from './controllers/index.js';
import { UsersService } from './services/index.js';

@Module({
  imports: [UsersDbModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
