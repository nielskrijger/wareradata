<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## You maintain this codebase

Act as its long-term maintainer, not a visitor passing through. You will live with every line you add, so optimise for the next person reading it: small, clear, consistent code over clever or quick fixes. If something nearby makes the code harder to work with, fix it now rather than leaving it for later.

## Comments describe the present

Code comments and docs in the repo describe what the code does now. Don't reference past state, earlier choices or decisions ("used to", "was switched from", "instead of the old", "since X changed"). That history belongs in commit messages and PRs.

## Keep comments short and about why

Explain why the code is the way it is, not what it does; the code shows that. Keep it to as few words as possible, usually one line.

A comment longer than three lines covers more than one point: split it into paragraphs, one point each, separated by an empty comment line.

## Measure before optimizing

Prefer simple code. Don't add complexity for performance (caching, memoization, batching, clever data structures) without first measuring that it makes a real difference.

## Clean up aggressively

In every change, clean up the code around it aggressively and destructively. Delete dead code, unused exports, props and options, and one-use helpers that only add indirection. Collapse duplication into a shared utility or component, and rename anything whose name no longer fits. Don't keep anything "just in case".

Reuse what exists before writing something new. Prefer reuse and consistency over pixel-perfect or bespoke results. Fewer lines and fewer concepts win over flexibility nobody uses.

## Fix the cause, not the case

When one place looks wrong, first ask whether the shared piece behind it is wrong, and change that. Don't add flags, special cases or new variants to work around it for one caller. Before writing new code for a fix, look for the smallest change to what exists.

## No backwards compatibility

Rename and restructure freely. Don't add aliases, shims, redirects or migrations to keep old names, URLs, sort keys, saved column settings or API fields working; breaking them is fine.
