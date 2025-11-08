import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, token: string, locale: string = 'en'): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    const subject = this.getLocalizedSubject('email_verification', locale);
    const html = this.getEmailVerificationTemplate(verificationUrl, locale);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, locale: string = 'en'): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    const subject = this.getLocalizedSubject('password_reset', locale);
    const html = this.getPasswordResetTemplate(resetUrl, locale);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string, locale: string = 'en'): Promise<void> {
    const subject = this.getLocalizedSubject('welcome', locale);
    const html = this.getWelcomeTemplate(name, locale);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(email: string, locale: string = 'en'): Promise<void> {
    const subject = this.getLocalizedSubject('password_changed', locale);
    const html = this.getPasswordChangedTemplate(locale);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send email changed notification
   */
  async sendEmailChangedNotification(
    oldEmail: string,
    newEmail: string,
    locale: string = 'en',
  ): Promise<void> {
    const subject = this.getLocalizedSubject('email_changed', locale);
    const html = this.getEmailChangedTemplate(newEmail, locale);

    // Send to both old and new email
    await this.sendEmail({
      to: oldEmail,
      subject,
      html,
    });

    await this.sendEmail({
      to: newEmail,
      subject,
      html,
    });
  }

  /**
   * Core email sending method
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // TODO: Implement actual email sending using your preferred provider
      // Examples: SendGrid, AWS SES, Nodemailer, etc.

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);

      // For development, just log the email
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.debug(`Email content: ${options.html || options.text}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Get localized subject
   */
  private getLocalizedSubject(type: string, locale: string): string {
    const subjects: Record<string, Record<string, string>> = {
      email_verification: {
        en: 'Verify Your Email Address',
        ru: 'Подтвердите ваш email адрес',
        ar: 'تحقق من عنوان بريدك الإلكتروني',
      },
      password_reset: {
        en: 'Reset Your Password',
        ru: 'Сброс пароля',
        ar: 'إعادة تعيين كلمة المرور',
      },
      welcome: {
        en: 'Welcome to SnailMarketplace!',
        ru: 'Добро пожаловать в SnailMarketplace!',
        ar: 'مرحبا بك في SnailMarketplace!',
      },
      password_changed: {
        en: 'Your Password Has Been Changed',
        ru: 'Ваш пароль был изменен',
        ar: 'تم تغيير كلمة المرور الخاصة بك',
      },
      email_changed: {
        en: 'Your Email Address Has Been Changed',
        ru: 'Ваш email адрес был изменен',
        ar: 'تم تغيير عنوان بريدك الإلكتروني',
      },
    };

    return subjects[type]?.[locale] || subjects[type]?.['en'] || type;
  }

  /**
   * Email verification template
   */
  private getEmailVerificationTemplate(verificationUrl: string, locale: string): string {
    const content: Record<string, any> = {
      en: {
        title: 'Verify Your Email',
        greeting: 'Hello!',
        message: 'Please click the button below to verify your email address.',
        button: 'Verify Email',
        expires: 'This link will expire in 24 hours.',
        ignore: 'If you did not create an account, please ignore this email.',
      },
      ru: {
        title: 'Подтвердите Email',
        greeting: 'Здравствуйте!',
        message: 'Пожалуйста, нажмите на кнопку ниже, чтобы подтвердить ваш email адрес.',
        button: 'Подтвердить Email',
        expires: 'Эта ссылка истечет через 24 часа.',
        ignore: 'Если вы не создавали аккаунт, пожалуйста, проигнорируйте это письмо.',
      },
      ar: {
        title: 'تحقق من بريدك الإلكتروني',
        greeting: 'مرحبا!',
        message: 'يرجى النقر على الزر أدناه للتحقق من عنوان بريدك الإلكتروني.',
        button: 'تحقق من البريد الإلكتروني',
        expires: 'ستنتهي صلاحية هذا الرابط خلال 24 ساعة.',
        ignore: 'إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.',
      },
    };

    const c = content[locale] || content['en'];

    return this.getBaseTemplate(
      c.title,
      `
        <h1>${c.greeting}</h1>
        <p>${c.message}</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #4CAF50; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            ${c.button}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">${c.expires}</p>
        <p style="color: #666; font-size: 14px;">${c.ignore}</p>
      `,
    );
  }

  /**
   * Password reset template
   */
  private getPasswordResetTemplate(resetUrl: string, locale: string): string {
    const content: Record<string, any> = {
      en: {
        title: 'Reset Your Password',
        greeting: 'Hello!',
        message: 'You requested to reset your password. Click the button below to proceed.',
        button: 'Reset Password',
        expires: 'This link will expire in 1 hour.',
        ignore: 'If you did not request a password reset, please ignore this email.',
      },
      ru: {
        title: 'Сброс пароля',
        greeting: 'Здравствуйте!',
        message: 'Вы запросили сброс пароля. Нажмите на кнопку ниже, чтобы продолжить.',
        button: 'Сбросить пароль',
        expires: 'Эта ссылка истечет через 1 час.',
        ignore: 'Если вы не запрашивали сброс пароля, пожалуйста, проигнорируйте это письмо.',
      },
      ar: {
        title: 'إعادة تعيين كلمة المرور',
        greeting: 'مرحبا!',
        message: 'لقد طلبت إعادة تعيين كلمة المرور. انقر على الزر أدناه للمتابعة.',
        button: 'إعادة تعيين كلمة المرور',
        expires: 'ستنتهي صلاحية هذا الرابط خلال ساعة واحدة.',
        ignore: 'إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.',
      },
    };

    const c = content[locale] || content['en'];

    return this.getBaseTemplate(
      c.title,
      `
        <h1>${c.greeting}</h1>
        <p>${c.message}</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #2196F3; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            ${c.button}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">${c.expires}</p>
        <p style="color: #ff9800; font-size: 14px;"><strong>${c.ignore}</strong></p>
      `,
    );
  }

  /**
   * Welcome email template
   */
  private getWelcomeTemplate(name: string, locale: string): string {
    const content: Record<string, any> = {
      en: {
        title: 'Welcome!',
        greeting: `Hello ${name}!`,
        message: 'Welcome to SnailMarketplace! Your email has been verified successfully.',
        explore: 'Start exploring our marketplace and discover amazing products.',
      },
      ru: {
        title: 'Добро пожаловать!',
        greeting: `Здравствуйте, ${name}!`,
        message: 'Добро пожаловать в SnailMarketplace! Ваш email успешно подтвержден.',
        explore: 'Начните изучать наш маркетплейс и открывайте для себя удивительные товары.',
      },
      ar: {
        title: 'مرحبا!',
        greeting: `مرحبا ${name}!`,
        message: 'مرحبا بك في SnailMarketplace! تم التحقق من بريدك الإلكتروني بنجاح.',
        explore: 'ابدأ في استكشاف سوقنا واكتشف منتجات رائعة.',
      },
    };

    const c = content[locale] || content['en'];

    return this.getBaseTemplate(
      c.title,
      `
        <h1>${c.greeting}</h1>
        <p>${c.message}</p>
        <p>${c.explore}</p>
      `,
    );
  }

  /**
   * Password changed template
   */
  private getPasswordChangedTemplate(locale: string): string {
    const content: Record<string, any> = {
      en: {
        title: 'Password Changed',
        greeting: 'Hello!',
        message: 'Your password has been changed successfully.',
        security: 'If you did not make this change, please contact support immediately.',
      },
      ru: {
        title: 'Пароль изменен',
        greeting: 'Здравствуйте!',
        message: 'Ваш пароль был успешно изменен.',
        security: 'Если вы не делали это изменение, пожалуйста, немедленно свяжитесь с поддержкой.',
      },
      ar: {
        title: 'تم تغيير كلمة المرور',
        greeting: 'مرحبا!',
        message: 'تم تغيير كلمة المرور الخاصة بك بنجاح.',
        security: 'إذا لم تقم بإجراء هذا التغيير، يرجى الاتصال بالدعم على الفور.',
      },
    };

    const c = content[locale] || content['en'];

    return this.getBaseTemplate(
      c.title,
      `
        <h1>${c.greeting}</h1>
        <p>${c.message}</p>
        <p style="color: #ff5722; font-size: 14px;"><strong>${c.security}</strong></p>
      `,
    );
  }

  /**
   * Email changed template
   */
  private getEmailChangedTemplate(newEmail: string, locale: string): string {
    const content: Record<string, any> = {
      en: {
        title: 'Email Changed',
        greeting: 'Hello!',
        message: `Your email address has been changed to: ${newEmail}`,
        security: 'If you did not make this change, please contact support immediately.',
      },
      ru: {
        title: 'Email изменен',
        greeting: 'Здравствуйте!',
        message: `Ваш email адрес был изменен на: ${newEmail}`,
        security: 'Если вы не делали это изменение, пожалуйста, немедленно свяжитесь с поддержкой.',
      },
      ar: {
        title: 'تم تغيير البريد الإلكتروني',
        greeting: 'مرحبا!',
        message: `تم تغيير عنوان بريدك الإلكتروني إلى: ${newEmail}`,
        security: 'إذا لم تقم بإجراء هذا التغيير، يرجى الاتصال بالدعم على الفور.',
      },
    };

    const c = content[locale] || content['en'];

    return this.getBaseTemplate(
      c.title,
      `
        <h1>${c.greeting}</h1>
        <p>${c.message}</p>
        <p style="color: #ff5722; font-size: 14px;"><strong>${c.security}</strong></p>
      `,
    );
  }

  /**
   * Base email template
   */
  private getBaseTemplate(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <div style="background-color: white; padding: 30px; border-radius: 5px;">
              ${content}
            </div>
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} SnailMarketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
