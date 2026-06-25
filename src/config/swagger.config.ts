import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: 'Factory ERP API',
  description: 'Enterprise Manufacturing ERP',
  version: '1.0.0',
}));