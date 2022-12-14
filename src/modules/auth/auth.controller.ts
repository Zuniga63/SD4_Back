import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import ValidationErrorDto from 'src/dto/validation-error.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDto } from '../users/dto/user.dto';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.tdo';
import LoginUserDto from './dto/login-user.dto';
import { ProfilePhotoDto } from './dto/profile-photo.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // --------------------------------------------------------------------------
  // SIGN UP
  // --------------------------------------------------------------------------
  @Post('local/signup')
  @ApiOperation({
    summary: 'Register user',
    description: 'Public end point for create the user and return access token',
  })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserDto) },
        access_token: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Some of the submitted field have not passed primary validation',
    type: ValidationErrorDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Has not passed the validation for saving in the database',
    type: ValidationErrorDto,
  })
  signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  // --------------------------------------------------------------------------
  // SIGN IN
  // --------------------------------------------------------------------------
  @UseGuards(LocalAuthGuard)
  @Post('local/singin')
  @ApiOperation({
    summary: 'Login User',
    description: 'Public end point for get access token and user info',
  })
  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({
    description: 'The user has been successfully login.',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserDto) },
        access_token: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Email or password invalid.' })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  // --------------------------------------------------------------------------
  // PROFILE
  // --------------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('local/profile')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'The user user info',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Only auth user can access' })
  getProfile(@Request() req: any) {
    return req.user;
  }

  // --------------------------------------------------------------------------
  // UPDATE PROFILE PHOTHO
  // --------------------------------------------------------------------------
  @Patch('local/profile/update-photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ProfilePhotoDto })
  @ApiOkResponse({
    description: 'The user user info',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserDto) },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'The image can not uploaded' })
  async updateProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    const user = req.user;
    return this.authService.updateProfilePhoto(user, file);
  }
  // --------------------------------------------------------------------------
  // DELETE PROFILE PHOTO
  // --------------------------------------------------------------------------
  @Patch('local/profile/remove-photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete profile photo' })
  @ApiOkResponse({
    description: 'The user user info',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UserDto) },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'The image could not be deleted' })
  removeProfilePhoto(@Request() req: any) {
    return this.authService.removeProfilePhoto(req.user);
  }
  // --------------------------------------------------------------------------
  // UPDATE PASSWORD
  // --------------------------------------------------------------------------
  @Patch('local/profile/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user Password' })
  @ApiOkResponse({ description: 'The user password was change succesfully' })
  @ApiUnauthorizedResponse({ description: 'The password is incorrect' })
  @ApiBadRequestResponse({
    description: 'The new password did not pass validations',
    type: ValidationErrorDto,
  })
  changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.authService.changeProfilePassword(req.user, changePasswordDto);
  }
}
