import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { userId: string }) {
    const found = await this.usersService.findByIdOrThrow(user.userId);
    const { password, ...result } = found;
    return result;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  async getFavorites(@CurrentUser() user: { userId: string }) {
    return this.usersService.getFavorites(user.userId);
  }

  @Post('me/favorites/:productId')
  @UseGuards(JwtAuthGuard)
  async addFavorite(
    @CurrentUser() user: { userId: string },
    @Param('productId') productId: string,
  ) {
    return this.usersService.addFavorite(user.userId, productId);
  }

  @Delete('me/favorites/:productId')
  @UseGuards(JwtAuthGuard)
  async removeFavorite(
    @CurrentUser() user: { userId: string },
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeFavorite(user.userId, productId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findByIdOrThrow(id);
    const { password, ...result } = user;
    return result;
  }
}
