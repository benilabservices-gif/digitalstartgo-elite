export interface EmailOptions {
  to: string | string[];
  type: string;
  ref: string;
  subject: string;
  html: string;
  text: string;
}
