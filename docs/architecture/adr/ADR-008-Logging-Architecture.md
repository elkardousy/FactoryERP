# ADR-008 — Logging Architecture

## Title

Structured JSON Logging via nestjs-pino with Sensitive Header Redaction

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

A production ERP system generates high volumes of logs across many requests. Log requirements:

1. **Structured format in production**: Logs must be machine-parseable for log aggregation systems (Elasticsearch, CloudWatch, Datadog)
2. **Human-readable in development**: Developers need pretty-printed logs during local development
3. **Request correlation**: Each log entry for a request must be traceable to the originating HTTP request
4. **Sensitive data protection**: Authorization headers and cookies must not appear in logs
5. **Consistent API**: All application code must use the same logging interface, not direct `console.log` calls

---

## Decision

**nestjs-pino** (Pino logger integration for NestJS) is used for all structured logging.

### Logger Service

A thin `LoggerService` wrapper (`src/core/logger/logger.service.ts`) abstracts the Pino logger:

```typescript
@Injectable()
export class LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  info(message: string, context?: string, trace?: string): void
  warn(message: string, context?: string, trace?: string): void
  error(message: string, context?: string, trace?: string): void
  debug(message: string, context?: string, trace?: string): void
}
```

All application code injects `LoggerService`. Direct use of `console.log` or `PinoLogger` in application code is prohibited.

### Logger Module

`LoggerModule` is decorated with `@Global()`, making `LoggerService` available in every module without explicit import:

```typescript
@Global()
@Module({
  imports: [LoggerModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppLoggerModule {}
```

### Environment-Aware Configuration

- **Development** (`NODE_ENV=development`): Pretty-printed output via `pino-pretty` — colorized, human-readable
- **Production** (`NODE_ENV=production`): Raw JSON — one log line per event, optimized for log aggregation

### Request Logging

nestjs-pino automatically logs every HTTP request/response with:
- Method, URL, status code, response time
- Request ID (correlation ID)
- User agent

### Sensitive Header Redaction

The following headers are automatically redacted from request logs:
- `authorization` → `[Redacted]`
- `cookie` → `[Redacted]`
- `set-cookie` → `[Redacted]`

This prevents JWT tokens and session cookies from appearing in log streams, where they could be harvested by unauthorized log viewers.

### NestJS Logger Integration

nestjs-pino replaces NestJS's built-in logger entirely:

```typescript
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
```

This means even NestJS's internal startup logs (module initialization, route registration) go through Pino, ensuring completely consistent log format.

---

## Rationale

**Why Pino over Winston?**

Pino is consistently the fastest Node.js logging library. Its async serialization model causes minimal impact on request latency. In an ERP with high query volume, logging overhead is a real concern. Pino's structured output also requires no adapter to be consumed by log aggregation services.

**Why `LoggerService` wrapper instead of injecting `PinoLogger` directly?**

The wrapper provides a consistent interface that:
1. Does not change if the underlying logger changes (e.g., replacing Pino with another library requires changing only `LoggerService`)
2. Has a stable, documented API that team members can learn once
3. Prevents application code from using advanced Pino features that may be incompatible with future logger replacements

**Why `@Global()` for `LoggerModule`?**

Logging is needed in virtually every module. Without global scope, every module would need to import `LoggerModule`. This creates noise in module files and creates friction for new modules.

**Why `bufferLogs: true` at bootstrap?**

When NestJS bootstraps, the Pino logger is not yet fully initialized. `bufferLogs: true` captures startup logs in memory and flushes them through Pino once the logger is available, ensuring startup logs are also structured.

**Why redact authorization and cookie headers?**

JWT tokens in `authorization` headers have long expiry windows (15 minutes to hours). If tokens appear in log streams, they are exploitable for as long as they remain valid. This is a PCI-DSS and OWASP-recommended practice for any authentication credential.

---

## Consequences

**Positive:**
- Log aggregation systems receive clean, consistently structured JSON
- Development experience is unimpaired — pretty-printed logs remain available
- Authorization credentials never appear in log files
- All application logs route through one configured channel — no `console.log` surprises in production
- NestJS internal logs match application logs in format

**Negative:**
- Pino's async log serialization means logs are not guaranteed to be flushed synchronously — in a crash scenario, the last few log lines may be lost
- `pino-pretty` is a development-only dependency that must not be used in production

**Trade-offs:**
- Structured logging requires discipline — developers must use `LoggerService.info()` rather than `console.log`. This is enforced by ESLint's `no-console` rule.

**Future Implications:**
- **Distributed tracing**: Pino can be integrated with OpenTelemetry to inject trace IDs into every log line
- **Log levels**: `LOG_LEVEL` is configurable via environment variable — this enables verbose logging in staging without redeployment
- **Log sampling**: In high-traffic production, request-level logging can be sampled by configuring Pino's transport

---

## Related Components

- `src/core/logger/logger.service.ts`
- `src/core/logger/logger.module.ts`
- `src/core/config/logger.config.ts`
- `src/app.module.ts` — LoggerModule import
- `src/main.ts` — Pino logger activation

---

## Alternatives Considered

### Winston

The traditional NestJS logging library. Rejected because:
- Significantly slower than Pino under load
- JSON output requires additional formatting configuration
- The NestJS-Winston adapter has had version compatibility issues

### NestJS Built-in Logger

NestJS's `Logger` class provides basic structured logging. Rejected because:
- Not designed for production log aggregation
- No request correlation, no automatic HTTP request/response logging
- No redaction for sensitive headers

### Application Performance Monitoring (e.g., DataDog APM, New Relic)

APM agents were considered as a replacement for structured logging. Rejected because:
- APM vendors have significant cost at production scale
- APM is complementary to — not a replacement for — structured logging
- Pino + a log aggregation service provides vendor-neutral observability

---

## Future Evolution

- **OpenTelemetry integration**: Pino can emit traces and spans to OpenTelemetry collectors for distributed tracing across future microservices
- **Correlation ID propagation**: The existing `CorrelationIdMiddleware` generates request IDs; these can be injected into every Pino log line via async context
- **Audit log separation**: Audit events currently use `AuditRepository` (database-written). High-volume audit events could be routed through Pino to a separate log stream for independent ingestion

---

## References

- `src/core/logger/logger.service.ts`
- `src/core/config/logger.config.ts`
- ADR-016 (Audit Architecture) — how audit events differ from application logs
- ADR-005 (Configuration System) — `LOG_LEVEL` configuration
