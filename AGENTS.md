<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Comments describe the present

Code comments and docs in the repo describe what the code does now. Don't reference past state, earlier choices or decisions ("used to", "was switched from", "instead of the old", "since X changed"). That history belongs in commit messages and PRs.

## Keep comments short and about why

Explain why the code is the way it is, not what it does; the code shows that. Keep it to as few words as possible, usually one line.

A comment longer than three lines covers more than one point: split it into paragraphs, one point each, separated by an empty comment line.

## Measure before optimizing

Prefer simple code. Don't add complexity for performance (caching, memoization, batching, clever data structures) without first measuring that it makes a real difference.

## Leave it cleaner than you found it

In every change, clean up nearby: dead code, duplication, and pieces that should be a shared utility or component. Reuse what exists before writing something new. Prefer reuse and consistency over pixel-perfect or bespoke results.
