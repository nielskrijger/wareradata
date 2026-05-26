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
    // Allow info/warn/error: info goes to stdout for normal operational
    // logging, warn/error to stderr for degradations and failures. Only plain
    // `console.log` (easy to leave behind as debug noise) stays disallowed.
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    // process.env is the canonical Next.js pattern for env vars.
    'node/prefer-global/process': 'off',
    // Lets inline JSX like `Page {x} of {y}` stay on one line.
    'style/jsx-one-expression-per-line': 'off',
    // Always require braces on if/else/for/while bodies, with the body on its own line.
    'curly': ['error', 'all'],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'style/curly-newline': ['error', 'always'],
    // Conflicts with the rules above: would re-reject the multi-line brace form they enforce.
    'style/max-statements-per-line': 'off',
    // JSDoc blocks (`/** ... */`) must span multiple lines.
    'jsdoc/multiline-blocks': ['error', { noSingleLineBlocks: true }],
  },
}, {
  // shadcn/ui components co-locate variant helpers (buttonVariants, badgeVariants)
  // with the component. Don't fight the upstream convention.
  files: ['components/ui/**/*.{ts,tsx}'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
})
