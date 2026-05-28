import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'สมัครสมาชิกใหม่' })
  @ApiResponse({
    status: 201,
    description: 'สมัครสำเร็จ — ได้รับ access_token',
  })
  @ApiResponse({ status: 409, description: 'อีเมลนี้ถูกใช้งานแล้ว' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'เข้าสู่ระบบ รับ JWT token' })
  @ApiResponse({
    status: 201,
    description: 'เข้าสู่ระบบสำเร็จ — ได้รับ access_token',
  })
  @ApiResponse({ status: 401, description: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'ออกจากระบบ และยกเลิก token' })
  @ApiResponse({ status: 201, description: 'ออกจากระบบสำเร็จ' })
  @ApiResponse({ status: 401, description: 'ไม่มี token หรือ token หมดอายุ' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: { jti: string; exp: number }) {
    return this.authService.logout(user.jti, user.exp);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'ขอ email รีเซ็ตรหัสผ่าน' })
  @ApiResponse({
    status: 201,
    description: 'ส่ง email สำเร็จ (คืน 200 เสมอเพื่อป้องกัน user enumeration)',
  })
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'รีเซ็ตรหัสผ่านด้วย token จาก email' })
  @ApiResponse({ status: 201, description: 'รีเซ็ตรหัสผ่านสำเร็จ' })
  @ApiResponse({ status: 400, description: 'token ไม่ถูกต้องหรือหมดอายุ' })
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
