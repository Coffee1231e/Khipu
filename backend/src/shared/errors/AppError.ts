// ============================================================
//  shared/errors/AppError.ts
//  Jerarquía de errores del dominio.
//  Cada error tiene un código HTTP, mensaje en español
//  y un flag isOperational para distinguir bugs de errores esperados.
// ============================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly codigo: string;

  constructor(
    message: string,
    statusCode = 500,
    codigo = 'ERROR_INTERNO',
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.codigo = codigo;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Errores HTTP estándar ────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(entidad = 'Recurso') {
    super(`${entidad} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado. Por favor inicia sesión.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Demasiadas solicitudes. Intenta de nuevo más tarde.') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

// ─── Errores de negocio específicos ─────────────────────────

export class Requires2FAError extends AppError {
  constructor() {
    super(
      'Para realizar esta acción debes tener el doble factor de autenticación (2FA) activado.',
      403,
      'REQUIRES_2FA',
    );
  }
}

export class AccountDisabledError extends AppError {
  constructor() {
    super(
      'Esta cuenta ha sido desactivada. Contacta al administrador del sistema.',
      403,
      'ACCOUNT_DISABLED',
    );
  }
}

export class RoleLimitReachedError extends AppError {
  constructor(rol: string) {
    super(
      `Se ha alcanzado el límite máximo de cuentas para el rol "${rol}". Ajusta el límite en la configuración del sistema.`,
      409,
      'ROLE_LIMIT_REACHED',
    );
  }
}

export class DuplicateInventoryNumberError extends AppError {
  constructor(numero: string) {
    super(
      `El número de inventario "${numero}" ya está registrado en el sistema.`,
      409,
      'DUPLICATE_INVENTORY_NUMBER',
    );
  }
}
