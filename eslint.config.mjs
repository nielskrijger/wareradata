import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  typescript: true,
  react: true,
  nextjs: true,
  formatters: true,
  ignores: [
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.playwright-mcp/**',
  ],
}, {
  rules: {
    // process.env is the canonical Next.js pattern for env vars.
    'node/prefer-global/process': 'off',
    // Lets inline JSX like `Page {x} of {y}` stay on one line.
    'style/jsx-one-expression-per-line': 'off',
  },
}, {
  // shadcn/ui components co-locate variant helpers (buttonVariants, badgeVariants)
  // with the component. Don't fight the upstream convention.
  files: ['components/ui/**/*.{ts,tsx}'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
})
