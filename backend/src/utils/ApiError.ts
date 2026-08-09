export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'غير مصرح لك بالوصول') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'ممنوع الوصول') {
    return new ApiError(403, message);
  }

  static notFound(message = 'العنصر المطلوب غير موجود') {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static internal(message = 'حدث خطأ في الخادم') {
    return new ApiError(500, message);
  }
}
