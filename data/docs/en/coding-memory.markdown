Claude Code and Codex start every session knowing nothing about the
checkout they run in beyond its files. Your agent may know a great deal:
what the project is, what was decided and why, what failed before, and
where you left off yesterday. They could ask it over MCP, but a model
rarely decides to call a tool for something it does not know it is
missing. So TeaNode puts what it knows in front of them, through the hooks
both tools run at points in a session's life.

## Setting it up

On each computer you code on:

1. Sign in with `teanode auth login`, so the hooks use your saved profile
   rather than a token in the tool's environment.
2. Run `teanode hook install claude-code`, or `teanode hook install codex`,
   or both. The hooks are added to `~/.claude/settings.json` or
   `~/.codex/hooks.json`, beside every hook already there.
3. For Codex, turn hooks on with `hooks = true` under `[features]` in
   `~/.codex/config.toml`. Codex asks you to trust a new hook before it
   first runs.

What the sessions are shown comes from your agent's memory, so it is only
as good as what memory has read about the checkout. Point a
[knowledge source](/doc/memory#where-else-it-reads-from) at the folder your
checkouts are in, and add the Claude Code or Codex source on that computer
too, so your past sessions are read as well.

`teanode hook uninstall claude-code` (or `codex`) takes out TeaNode's hooks
and leaves the rest of the file alone.

## What a session is shown

### When it starts

When a session starts, resumes, or is compacted, it is shown the checkout's
project page: the summary, the facts on it most in use, and the same for any
other project page the checkout is filed on. What the session can read from
the files itself (the remotes, the languages, where the checkout is) is left
out.

It is also shown the last session held in that directory, or anywhere in the
checkout: which tool, its title, when it was last active, your last three
requests and the start of its last answer. No model writes this; it is what
was said, read from the stored transcript, so it is there as soon as the
transcript is read. A session you resume is not shown to itself.

For an invented checkout, the start of a session looks like this:

    <teanode-memory>
    TeaNode, the person's agent, remembers this about the checkout at
    ~/src/greenfinch-site (page projects/greenfinch-site). Facts are cited
    as page#number; its memory tool reads a page whole.

    projects/greenfinch-site: The marketing site for Greenfinch, built
    with Astro and deployed from main.
    - projects/greenfinch-site#4 The pricing page must render without
      JavaScript, because the partner portal embeds it.
    - projects/greenfinch-site#9 Images go through the CDN's resizer,
      never into the repository.

    The last session in this directory (claude-code, "Pricing table on
    phones", last active 2 hours ago):
    The person's last requests:
    - make the pricing table scroll sideways on a phone
    - keep the first column pinned
    Its last answer: The table now scrolls inside its card and the plan
    names stay in view…
    </teanode-memory>

### Before each prompt

Each prompt you type gets the same recall a turn of your agent does, with
one difference: what may be carried is kept to the checkout's project. That
is the project page, the pages under it, the projects, things and folders
it is linked to by a link somebody stated, and the topics it links to;
never a person, a month, or a broad topic that merely mentions it. A
question about the build therefore does not bring your mail, your money or
your colleagues into a third party's model, and the pages left out do not
spend the budget.

Beside the pages come the lessons close to the prompt. A lesson is what
your agent's own work taught (when it applies, what worked, what to avoid),
and it is kept only when a command it names succeeded, so what the agent
merely said about its work is never enough. Only a lesson near enough in
meaning to the prompt is shown.

Recall stays quiet when it has nothing to add:

- a page shown in the session's last five prompts is not shown again;
- a prompt of fewer than three words, a slash command, and text the tool
  sends on its own (such as a finished background task) recall nothing;
- a prompt that recalls nothing from the project shows nothing.

Install with `--everywhere` to recall from all of memory instead.

### After each answer

When an answer ends, the session is compacted, or it ends, the computer's
Claude Code or Codex source is asked to read its transcripts again now
instead of at its next scheduled time. It goes ahead of the other sources
waiting for that computer, so the session is searchable within about a
minute, and the next session in that directory knows where this one
stopped. Without such a source on the computer, the next session still sees
what was filed before.

## Which checkout

A checkout's profile records where it is and on which computer, and the
hook looks for the deepest checkout holding the session's directory on the
computer it runs on.

A checkout this computer's sources never read is matched by its git remote
instead, since the same path on another computer proves nothing. The
session is then told where and at which commit memory read the project, and
on the computer it was read on but at another commit, that memory may be
out of date. A directory outside any checkout memory knows is shown
nothing.

## Seeing what a session sees

Three places show exactly what a session would be shown, without starting
one and without marking anything as used:

- `teanode agent memory checkout [directory]` prints the session start;
  with `--prompt "<words>"` it prints what that prompt would recall, and
  `--everywhere` widens it.
- The Recall dialog on the Knowledge page has a checkout field that does
  the same.
- Your agent's `memory` tool has a `checkout` action, so you can ask it.

## When it shows nothing

The hooks never get in the tool's way. A hook that cannot reach your
server, or fails for any other reason, shows nothing and exits cleanly, and
what went wrong is written to `hook.log` under your cache directory
(`~/.cache/teanode/hooks` on Linux). If a session should have been shown
something and was not, check that:

- the checkout has been read: `teanode agent memory checkout` in that
  directory says which page it found;
- you are signed in on that computer with the profile the hook names;
- for Codex, hooks are turned on and the hook is trusted.

## What it costs

Every prompt costs one embedding and a few queries; a session start a few
more. No model is asked to write anything, and nothing is marked as used,
so a busy coding day does not shift what your agent thinks is important.

## Next

- [Coding sessions](/doc/coding-sessions) is the other direction: your
  agent seeing and prompting those sessions through herdr.
- [Memory](/doc/memory) is what the sessions are being shown.
- [The command line](/doc/command-line#teanode-hook) lists the `teanode
  hook` commands.
- [`docs/subsystems/memory.md`](https://github.com/ziyan/teanode/blob/main/docs/subsystems/memory.md#in-the-persons-coding-sessions)
  says how it works in detail.
