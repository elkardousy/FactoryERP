import {
  BadRequestException,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';

function flattenValidationErrors(errors: ValidationError[]): string[] {
  const result: string[] = [];

  const walk = (items: ValidationError[]) => {
    for (const item of items) {
      if (item.constraints) {
        result.push(...Object.values(item.constraints));
      }

      if (item.children?.length) {
        walk(item.children);
      }
    }
  };

  walk(errors);

  return result;
}

export const GlobalValidationPipe = new ValidationPipe({
  transform: true,

  whitelist: true,

  forbidNonWhitelisted: true,

  transformOptions: {
    enableImplicitConversion: true,
  },

  stopAtFirstError: false,

  validationError: {
    target: false,
    value: false,
  },

  exceptionFactory(errors) {
    return new BadRequestException(flattenValidationErrors(errors));
  },
});
