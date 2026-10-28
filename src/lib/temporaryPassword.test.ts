import { describe, expect, it } from 'vitest';
import { generateTemporaryPassword } from './temporaryPassword';

describe('generateTemporaryPassword', () => {
  it('makes a 14 character password by default', () => {
    expect(generateTemporaryPassword()).toHaveLength(14);
  });

  it('uses only easy-to-read letters and digits', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateTemporaryPassword()).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
    }
  });

  it('always includes a capital letter, a small letter and a digit', () => {
    for (let i = 0; i < 50; i += 1) {
      const password = generateTemporaryPassword();
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
    }
  });

  it('does not repeat', () => {
    expect(generateTemporaryPassword()).not.toBe(generateTemporaryPassword());
  });
});