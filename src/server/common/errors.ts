/**
 * 统一业务异常体系
 * 所有业务错误继承 AppError，由全局 errorHandler 统一处理
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "请求参数不正确", code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "未登录或登录已过期", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "没有权限执行此操作", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "资源不存在", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "资源冲突", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "请求过于频繁，请稍后再试", code = "RATE_LIMIT_EXCEEDED") {
    super(message, 429, code);
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message = "外部服务暂时不可用", code = "EXTERNAL_SERVICE_ERROR") {
    super(message, 502, code);
    this.service = service;
  }
}
