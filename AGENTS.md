<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Comments describe the present

Code comments and docs in the repo describe what the code does now. Don't reference past state, earlier choices or decisions ("used to", "was switched from", "instead of the old", "since X changed"). That history belongs in commit messages and PRs.

## Keep comments short and about why

Explain why the code is the way it is, not what it does; the code shows that. Keep it to as few words as possible, usually one line.
