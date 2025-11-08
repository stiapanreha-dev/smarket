# Sprint 1: Authentication & User Management
## Security Foundation (День 6-10)

**Dates:** 22-26 Января 2024  
**Goal:** Реализовать безопасную систему аутентификации и управления пользователями  
**Team Focus:** Backend - 70%, Frontend - 30%  

---

## 🎯 Sprint Goals

1. **User Registration** с email верификацией
2. **JWT Authentication** с refresh tokens
3. **User Profiles** с поддержкой локализации
4. **Password Management** (reset, change)
5. **Role-Based Access Control** (RBAC)

---

## 📋 User Stories

### AUTH-001: User Registration (8 SP)
**As a** new visitor  
**I want** to create an account  
**So that** I can buy products or become a merchant  

**Acceptance Criteria:**
- [ ] Registration with email and password
- [ ] Password strength validation
- [ ] Email verification sent
- [ ] Duplicate email check
- [ ] Welcome email sent
- [ ] User locale/currency detection

**Backend Implementation:**
```typescript
// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, Matches, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['en', 'ru', 'ar'])
  locale?: string;

  @IsOptional()
  @IsEnum(['USD', 'RUB', 'AED'])
  currency?: string;
}

// src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; tokens: TokenPair }> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      emailVerificationToken: this.generateVerificationToken(),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.sendVerificationEmail(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, emailVerificationToken, ...sanitized } = user;
    return sanitized;
  }
}

// src/modules/auth/auth.controller.ts
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }
}
```

---

### AUTH-002: JWT Authentication (8 SP)
**As a** registered user  
**I want** to securely login  
**So that** I can access my account  

**Acceptance Criteria:**
- [ ] Login with email/password
- [ ] JWT access token (15 min)
- [ ] Refresh token (30 days)
- [ ] Token rotation on refresh
- [ ] Logout invalidates refresh token
- [ ] Rate limiting on login attempts

**Implementation:**
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }
    
    return user;
  }
}

// src/modules/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

// src/modules/auth/auth.service.ts (login method)
async login(loginDto: LoginDto): Promise<LoginResponse> {
  // Check rate limiting
  const attempts = await this.checkLoginAttempts(loginDto.email);
  if (attempts >= 5) {
    throw new TooManyRequestsException('Too many login attempts. Please try again later.');
  }

  const user = await this.userRepository.findOne({
    where: { email: loginDto.email },
  });

  if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
    await this.incrementLoginAttempts(loginDto.email);
    throw new UnauthorizedException('Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new UnauthorizedException('Please verify your email first');
  }

  // Clear login attempts on successful login
  await this.clearLoginAttempts(loginDto.email);

  const tokens = await this.generateTokens(user);
  await this.saveRefreshToken(user.id, tokens.refreshToken);

  return {
    user: this.sanitizeUser(user),
    tokens,
  };
}

async generateTokens(user: User): Promise<TokenPair> {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
  };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    }),
    this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    }),
  ]);

  return {
    accessToken,
    refreshToken,
  };
}

async refreshTokens(refreshToken: string): Promise<TokenPair> {
  try {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    // Check if refresh token exists in database
    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        userId: payload.sub,
        revoked: false,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check for token reuse (possible token theft)
    if (storedToken.used) {
      // Revoke all tokens for this user
      await this.revokeAllUserTokens(payload.sub);
      throw new UnauthorizedException('Token reuse detected');
    }

    // Mark token as used
    storedToken.used = true;
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    const user = await this.usersService.findById(payload.sub);
    const newTokens = await this.generateTokens(user);
    
    // Save new refresh token
    await this.saveRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

---

### AUTH-003: User Profile Management (5 SP)
**As a** registered user  
**I want** to manage my profile  
**So that** I can keep my information updated  

**Acceptance Criteria:**
- [ ] View profile
- [ ] Update profile (name, phone, locale, currency)
- [ ] Upload avatar
- [ ] Change password
- [ ] View login history

**Implementation:**
```typescript
// src/modules/user/dto/update-profile.dto.ts
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phone?: string;

  @IsOptional()
  @IsEnum(['en', 'ru', 'ar'])
  locale?: string;

  @IsOptional()
  @IsEnum(['USD', 'RUB', 'AED'])
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

// src/modules/user/user.controller.ts
@Controller('users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, updateProfileDto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const avatarUrl = await this.s3Service.uploadFile(file, `avatars/${user.id}`);
    return this.userService.updateAvatar(user.id, avatarUrl);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(user.id, changePasswordDto);
  }

  @Get('login-history')
  @ApiOperation({ summary: 'Get login history' })
  async getLoginHistory(@CurrentUser() user: User) {
    return this.userService.getLoginHistory(user.id);
  }
}

// src/modules/user/user.service.ts
@Injectable()
export class UserService {
  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If phone number is being updated, mark as unverified
    if (updateDto.phone && updateDto.phone !== user.phone) {
      user.phoneVerified = false;
    }

    Object.assign(user, updateDto);
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    // Emit profile updated event
    await this.eventEmitter.emit('user.profile.updated', {
      userId: user.id,
      changes: updateDto,
    });

    return this.sanitizeUser(user);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    
    await this.userRepository.save(user);

    // Revoke all refresh tokens
    await this.authService.revokeAllUserTokens(userId);

    // Send notification
    await this.emailService.sendPasswordChangedNotification(user);
  }
}
```

---

### AUTH-004: Password Reset (5 SP)
**As a** user who forgot password  
**I want** to reset my password  
**So that** I can regain access to my account  

**Acceptance Criteria:**
- [ ] Request reset via email
- [ ] Secure reset token
- [ ] Token expires in 1 hour
- [ ] Password reset confirmation email
- [ ] Invalidate all sessions after reset

**Implementation:**
```typescript
// src/modules/auth/dto/password-reset.dto.ts
export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  newPassword: string;
}

// src/modules/auth/auth.service.ts (password reset methods)
async requestPasswordReset(email: string): Promise<void> {
  const user = await this.userRepository.findOne({ where: { email } });
  
  // Don't reveal if user exists
  if (!user) {
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Save hashed token to database
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  await this.userRepository.save(user);

  // Send reset email with unhashed token
  await this.emailService.sendPasswordResetEmail(user, resetToken);
}

async resetPassword(token: string, newPassword: string): Promise<void> {
  // Hash the token to compare with database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await this.userRepository.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: MoreThan(new Date()),
    },
  });

  if (!user) {
    throw new BadRequestException('Invalid or expired reset token');
  }

  // Update password
  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.passwordChangedAt = new Date();

  await this.userRepository.save(user);

  // Revoke all refresh tokens
  await this.revokeAllUserTokens(user.id);

  // Send confirmation email
  await this.emailService.sendPasswordResetConfirmation(user);
}
```

---

### AUTH-005: Role-Based Access Control (5 SP)
**As a** system  
**I want** to control access based on roles  
**So that** users only access what they're allowed to  

**Acceptance Criteria:**
- [ ] Define roles (customer, merchant, admin)
- [ ] Role-based guards
- [ ] Permission checks
- [ ] Merchant registration flow
- [ ] Admin panel access control

**Implementation:**
```typescript
// src/common/enums/role.enum.ts
export enum UserRole {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

// src/common/decorators/roles.decorator.ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// src/modules/merchant/merchant.controller.ts
@Controller('merchants')
@ApiTags('Merchants')
@UseGuards(JwtAuthGuard)
export class MerchantController {
  @Post('register')
  @ApiOperation({ summary: 'Register as merchant' })
  async registerMerchant(
    @CurrentUser() user: User,
    @Body() registerMerchantDto: RegisterMerchantDto,
  ) {
    return this.merchantService.registerMerchant(user.id, registerMerchantDto);
  }

  @Get('dashboard')
  @Roles(UserRole.MERCHANT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get merchant dashboard' })
  async getDashboard(@CurrentUser() user: User) {
    return this.merchantService.getDashboard(user.merchantId);
  }
}

// Permission-based access control
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userPermissions = await this.permissionService.getUserPermissions(user.id);
    
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
```

---

## 📱 Frontend Components

### Login Component (React)
```tsx
// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
    } catch (err) {
      setError(err.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('auth.email')}
        </label>
        <input
          type="email"
          {...register('email', {
            required: t('auth.emailRequired'),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t('auth.invalidEmail'),
            },
          })}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('auth.password')}
        </label>
        <input
          type="password"
          {...register('password', {
            required: t('auth.passwordRequired'),
            minLength: {
              value: 8,
              message: t('auth.passwordMinLength'),
            },
          })}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.password && (
          <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? t('auth.loggingIn') : t('auth.login')}
      </button>

      <div className="text-center">
        <a href="/auth/forgot-password" className="text-blue-600 hover:underline">
          {t('auth.forgotPassword')}
        </a>
      </div>
    </form>
  );
}
```

---

## 📊 Testing

### Unit Tests
```typescript
// src/modules/auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if user exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
```

---

## ✅ Sprint Checklist

### Development
- [ ] User registration endpoint
- [ ] Email verification
- [ ] Login/logout endpoints
- [ ] JWT implementation
- [ ] Refresh token rotation
- [ ] Password reset flow
- [ ] User profile CRUD
- [ ] Role-based guards

### Testing
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for auth flow
- [ ] E2E test for registration

### Documentation
- [ ] API documentation (Swagger)
- [ ] Authentication flow diagram
- [ ] Security best practices doc

### DevOps
- [ ] Environment variables for JWT secrets
- [ ] Rate limiting on auth endpoints
- [ ] Security headers configured

---

## 📈 Metrics

- Registration success rate: >95%
- Login success rate: >98%
- Average login time: <2s
- Password reset completion: >80%
- Test coverage: >80%

---

## 🔄 Next Sprint Preview

**Sprint 2: Product Catalog**
- Product CRUD
- Categories & tags
- Search implementation
- Image upload
- Merchant product management

**Handover Notes:**
- Auth system complete and tested
- User roles defined
- Merchant registration ready
- Ready for product module integration

---

**Sprint 1 Complete: Secure authentication foundation established! 🔐**