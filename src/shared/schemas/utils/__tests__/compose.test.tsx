import { describe, expect, it } from 'vitest'
import { compose } from '../compose'

describe('compose', () => {
	describe('variable interpolation', () => {
		it('should interpolate single variable', () => {
			const result = compose('Hello {name}', { name: 'World' })
			expect(result).toBe('Hello World')
		})

		it('should interpolate multiple variables', () => {
			const result = compose('Hello {firstName} {lastName}', {
				firstName: 'John',
				lastName: 'Doe',
			})
			expect(result).toBe('Hello John Doe')
		})

		it('should handle missing variables', () => {
			const result = compose('Hello {name}', {})
			expect(result).toBe('Hello {name}')
		})

		it('should handle numeric variables', () => {
			const result = compose('Count: {count}', { count: 42 })
			expect(result).toBe('Count: 42')
		})

		it('should handle empty string', () => {
			const result = compose('', { name: 'World' })
			expect(result).toBe('')
		})
	})

	describe('interval plural syntax', () => {
		it('should handle exact number match', () => {
			const result = compose('(1)[You have 1 item];(2)[You have 2 items]', {
				count: 1,
			})
			expect(result).toBe('You have 1 item')
		})

		it('should handle range with specific numbers', () => {
			const result = compose(
				'(1)[One];(2-3)[Two or Three];(4-5)[Four or Five]',
				{ count: 3 },
			)
			expect(result).toBe('Two or Three')
		})

		it('should handle empty range end', () => {
			const result = compose('(1)[One];(2-)[Two or more]', { count: 3 })
			expect(result).toBe('Two or more')
		})

		it('should return original string if no interval matches', () => {
			const result = compose('(1)[One];(2)[Two]', { count: 3 })
			expect(result).toBe('(1)[One];(2)[Two]')
		})

		it('should handle multiple intervals with variable interpolation', () => {
			const result = compose(
				'(1)[You have {count} item];(2-inf)[You have {count} items]',
				{ count: 1 },
			)
			expect(result).toBe('You have 1 item')
		})
	})

	describe('edge cases', () => {
		it('should handle null or undefined params', () => {
			const result = compose('Hello {name}')
			expect(result).toBe('Hello {name}')
		})

		it('should handle malformed interval syntax', () => {
			const result = compose('(1)[One](2)[Two]', { count: 1 })
			expect(result).toBe('(1)[One](2)[Two]')
		})

		it('should handle invalid interval ranges', () => {
			const result = compose('(a-b)[Invalid]', { count: 1 })
			expect(result).toBe('(a-b)[Invalid]')
		})
	})
})
