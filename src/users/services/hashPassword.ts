import * as crypto from 'crypto';

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = process.env.PASSWORD_SALT;
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (error, derivedKey) => {
      if (error) {
        reject(error);
      }
      resolve(derivedKey.toString('hex'));
    });
  });
}
