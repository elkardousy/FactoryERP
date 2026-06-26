import { SetMetadata } from '@nestjs/common';
import { APPROVAL_KEY } from '../constants/authorization.constants';

export const RequireApproval = (workflowTemplateCode: string) =>
  SetMetadata(APPROVAL_KEY, workflowTemplateCode);
