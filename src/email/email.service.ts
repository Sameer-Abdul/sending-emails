import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly attachmentsDir = path.join(process.cwd(), 'attachments');

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME');

    if (!this.apiKey || !this.senderEmail || !this.senderName) {
      this.logger.warn('Brevo email configuration is incomplete. Emails may fail to send.');
    }
  }

  private loadAttachment(filename: string) {
    try {
      const filePath = path.join(this.attachmentsDir, filename);
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Attachment file not found: ${filename}`);
        return null;
      }
      const fileData = fs.readFileSync(filePath);
      return {
        name: filename,
        content: fileData.toString('base64'),
      };
    } catch (error) {
      this.logger.error(`Error loading attachment ${filename}:`, error);
      return null;
    }
  }

  async sendWelcomeEmail(name: string, email: string) {
    if (!this.apiKey || !this.senderEmail || !this.senderName) {
      this.logger.error('Brevo configuration is incomplete. Cannot send email.');
      return false;
    }

    // Load all attachments
    const attachments = [
      '19-20.pdf',
      '60cumhr-M1-M1.25-M2.5-M3-Bro2018.pdf',
      'gandhiji.pdf'
    ]
    .map(filename => this.loadAttachment(filename))
    .filter(Boolean);

    const data: any = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [
        {
          email,
          name: name || email.split('@')[0],
        },
      ],
      subject: 'Welcome to Hamal Solutions',
      htmlContent: `
        <p>Hello <b>${name || 'there'}</b>,</p>
        <p>Welcome to <b>Hamal Solutions</b>! We are happy to have you onboard.</p>
        <p>Please find the attached documents.</p>
        <p>Regards,<br>Hamal Solutions Team</p>
      `,
    };

    // Only add attachments if we have any
    if (attachments.length > 0) {
      data.attachment = attachments;
    } else {
      this.logger.warn('No valid attachments found, sending email without attachments');
    }

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        data,
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Email sent to ${email} with ${attachments.length} attachments`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${email}:`, error.response?.data || error.message);
      return false;
    }
  }
}
