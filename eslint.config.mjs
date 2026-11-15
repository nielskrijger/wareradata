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
    // Keep lines readable. Stylistic can't auto-wrap, so long lines are wrapped by
    // hand. Exempt: URLs, regexes, and a line that is nothing but one string
    // (`key: '…',`, `attr="…"`), since splitting prose or a class list only hurts.
    'style/max-len': ['error', {
      code: 120,
      ignoreUrls: true,
      ignoreRegExpLiterals: true,
      ignorePattern: [
        String.raw`^\s*(?:[\w$-]+\s*[:=]\s*)?`, // optional `key:` or `attr=`
        String.raw`(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\x60(?:[^\x60\\]|\\.)*\x60),?$`, // one string
      ].join(''),
    }],
  },
}, {
  // shadcn/ui components co-locate variant helpers (buttonVariants, badgeVariants)
  // with the component. Don't fight the upstream convention.
  files: ['components/ui/**/*.{ts,tsx}'],
  rules: {
    'react-refresh/only-export-components': 'off',
    // Generated code with long Tailwind class strings; keep it diffable against
    // upstream rather than rewrapping it.
    'style/max-len': 'off',
  },
}, {
  // Prose-heavy static HTML; wrapping paragraphs would only add noise.
  files: ['public/**'],
  rules: {
    'style/max-len': 'off',
  },
})
