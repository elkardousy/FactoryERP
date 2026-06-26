import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/authorization.constants';

export const Roles = (...roleCodes: string[]) =>
  SetMetadata(ROLES_KEY, roleCodes);
