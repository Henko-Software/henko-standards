import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		// Los tests de Postgres comparten una base: uno por vez.
		fileParallelism: false
	}
})
