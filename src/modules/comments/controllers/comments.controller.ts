import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from '../services/index.js';
import { CreateCommentDto, UpdateCommentDto } from '../dto/index.js';

@ApiTags('Comment')
@Controller('posts/:postId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Get()
    findAll(@Param('postId', ParseIntPipe) postId: number) {
        return this.commentsService.findByPost(postId);
    }

    @Post()
    create(
        @Param('postId', ParseIntPipe) postId: number,
        @Body() dto: CreateCommentDto,
    ) {
        return this.commentsService.create(postId, dto);
    }

    @Patch(':id')
    update(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCommentDto,
    ) {
        return this.commentsService.update(postId, id, dto);
    }

    @Delete(':id')
    remove(
        @Param('postId', ParseIntPipe) postId: number,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.commentsService.remove(postId, id);
    }
}
