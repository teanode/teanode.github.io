If you keep several Claude Code and Codex sessions open at once, each in a
terminal of its own, your agent can work in them beside you. It sees every
session on every computer you attached, reads what each one did, types an
instruction into one where you can see it, and brings you the questions they
stop to ask, so you can answer from the drawer, from your phone, or from a
chat app that speaks MCP while you are away from the desk.

It does this through [herdr](https://herdr.dev), a
terminal workspace manager for coding agents, which holds the terminals in
panes and recognizes the coding agent in each.

## What you need

- herdr running on your computer, with your coding sessions in its panes.
- `teanode computer start` running on that computer, from a current
  `teanode`. The program on the computer watches herdr's socket and reports
  to your server; nothing else is installed.

Each person's sessions are their own: the program signs in as you, and only
your agent sees your panes.

## What it does

**Lists them.** The Herdr sessions card on the Connections tab of your agent
page, `teanode computer herdr list`, and the agent's `herdr` tool all show
every session: its name as you find it in herdr, whether it is working,
idle or asking, which coding agent it is, the computer, the directory and the
title. A session asking a question comes first.

**Reads them.** The last turns of a session's history, or what its pane
shows now.

**Types into them.** An instruction is typed into the pane in front of you,
the same as if you had typed it, and a session at work reads it as a message
in its turn. There is one process, one history and one screen, which you and
the agent share, and you can take over at any moment.

**Brings you their questions.** When a session stops to ask something (which
option to take, whether it may run a command or make an edit, whether you
approve its plan), the question is written into your main conversation. The
drawer opens with the options as buttons, and the same question goes to the
chat app you linked. Whoever answers first wins: the program on the computer
reads the screen again before pressing your answer, and refuses one whose
question has gone or changed.

**Tells you when one finishes.** Ask the agent to watch a session, and the
conversation you asked in is woken when that session finishes its turn, so
"tell me when the tests pass, then have it open the pull request" works.

**Opens and closes them.** A new Claude Code or Codex session in a directory,
in a new tab of the workspace named after it, or with its permission prompts
off when you ask. A session is closed only when it is not working.

## From anywhere

Every one of these actions is on the agent's `herdr` tool, so anything that
reaches your agent reaches your coding sessions. A [voice call](/doc/voice)
in the drawer can ask what each session is doing and answer the one that is
waiting. So can ChatGPT, Grok, or any other assistant that speaks the Model
Context Protocol, once it is [connected to your server](/doc/mcp): ask it
from your phone, by voice in the car if you like, what your sessions are up
to, and tell one what to do next.

To an MCP client the tool says it is read-only, at your word, so these
assistants run it without asking each time; most would not let you always
allow a tool that writes. Sending and answering raise no confirmation card
in the dashboard either, because a card for every answer was more than
people wanted. If you want one, put `herdr` on your own "ask me first" list.

## How it knows a session is asking

From the screen. The program recognizes the forms the current Claude Code and
Codex draw for a question, an approval and a plan, and decides each session's
state itself rather than taking herdr's, because typing an instruction into a
form would answer it. A coding agent that draws its forms differently is not
recognized until the recognizer learns it; the session then shows as idle or
unknown, and its screen can still be read.

`teanode computer herdr setup` can also put reporting hooks into Claude Code's
settings on that computer, beside the ones there and with a copy of the file
kept first. They report what happens and decide nothing. They are put in only
when you ask, since they change your Claude Code settings.

A restart of the program on the computer, which every upgrade causes, loses
neither a question still waiting nor a watch.

## Next

- [The command line](/doc/command-line#teanode-computer) lists every
  `teanode computer herdr` command.
- [Voice](/doc/voice) is talking to your agent in the drawer.
- [MCP](/doc/mcp) is connecting ChatGPT, Grok or an editor to your server.
- [`docs/subsystems/devices.md`](https://github.com/ziyan/teanode/blob/main/docs/subsystems/devices.md)
  says how the computer program works in detail.
