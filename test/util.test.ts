import { describe, it, expect } from 'vitest';
import { nf } from '../src/util';

describe('nf', () => {
        it('rounds to the specified precision by default', () => {
                expect(nf(1.23456)).toBe('1.235');
                expect(nf(-2.3456)).toBe('-2.346');
        });

        it('supports custom precision values', () => {
                expect(nf(Math.PI, 2)).toBe('3.14');
                expect(nf(Math.PI, 5)).toBe('3.14159');
        });
});
