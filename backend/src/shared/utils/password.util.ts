import crypto from 'crypto';

/**
 * Genera una contraseña aleatoria y segura.
 * Garantiza al menos una letra minúscula, una mayúscula, un número y un símbolo.
 * @param longitud Longitud de la contraseña a generar (por defecto 12).
 * @returns Contraseña generada.
 */
export function generarPasswordSegura(longitud: number = 12): string {
  const minusculas = 'abcdefghijklmnopqrstuvwxyz';
  const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  const simbolos = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  const todos = minusculas + mayusculas + numeros + simbolos;

  let password = '';
  
  // Garantizar al menos un carácter de cada tipo
  password += minusculas[crypto.randomInt(0, minusculas.length)];
  password += mayusculas[crypto.randomInt(0, mayusculas.length)];
  password += numeros[crypto.randomInt(0, numeros.length)];
  password += simbolos[crypto.randomInt(0, simbolos.length)];

  // Rellenar el resto aleatoriamente
  for (let i = password.length; i < longitud; i++) {
    password += todos[crypto.randomInt(0, todos.length)];
  }

  // Mezclar los caracteres para que el patrón no sea predecible
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}
