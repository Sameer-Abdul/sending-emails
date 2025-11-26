import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { EmailService } from '../email/email.service';

@Injectable()
export class UploadService {
  constructor(private readonly emailService: EmailService) {}

  async processExcel(file: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    console.log('Processing Excel file...');

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} rows in Excel file`);

    let success = 0;
    let failed = 0;
    const failedEmails: { email: string; error: string }[] = [];

    let index = 0;
    for (const row of rows) {
      index++;
      const name = row['name'] || row['Name'] || row['NAME'];
      const email = row['email'] || row['Email'] || row['EMAIL'];

      console.log(`Processing row ${index}:`, row);

      if (!email) {
        console.warn(`Row ${index} skipped: missing email`);
        failed++;
        failedEmails.push({ email: '(missing)', error: 'No email in row' });
        continue;
      }

      try {
        console.log(`Sending email to ${email}...`);
        await this.emailService.sendWelcomeEmail(name, email);
        success++;
      } catch (error: any) {
        console.error('Error sending email:', error?.message || error);
        failed++;
        failedEmails.push({ email, error: error?.message || 'Unknown error' });
      }
    }

    const message = `${success} emails sent, ${failed} failed`;

    console.log('Processing complete:', { total: rows.length, success, failed });

    return {
      total: rows.length,
      success,
      failed,
      message,
      failedEmails,
    };
  }
}
