The Model Context Protocol is how programs tell each other "here are the
things I can do, call them by name". TeaNode is on both ends of it, and the
two directions share a wire format and almost nothing else.

**Outward**, your agent connects to servers you have, so their tools become
its tools. **Inward**, TeaNode answers the protocol itself, so a coding
harness or an editor you run can use your agent's tools, and can put a
question to your agent in words.

## Answering it: your tools, from your editor

    POST /api/v1/mcp

Authenticated by an ordinary API token. There is no session: every request
carries the token and nothing is kept between requests, so a restart on
either side loses nothing.

Two ways to connect:

    # on the machine your command line is signed in on
    claude mcp add teanode -- teanode agent mcp serve

    # or from anywhere, with a token
    claude mcp add --transport http teanode \
        https://mail.example.com/api/v1/mcp \
        --header "Authorization: Bearer tnt_..."

The first is a pipe rather than a second implementation. `teanode agent mcp
serve` posts each message to that same endpoint using the profile you are
already signed in with, so whatever the server offers it offers, and there is
no token to paste anywhere.

### What a caller is offered

Your whole catalogue, filtered the way a conversation's is: what your
permissions allow, less whatever the operator switched off, plus the tools of
the servers you have connected and the skills the operator installed.
Somebody who may not read mail is not offered the mail search, because it is
not in their catalogue to begin with.

This grants nothing the token did not already grant. An API token carries its
account's whole permissions, and the GraphQL API beside this endpoint already
exposes every operation those permissions allow. What changes is the shape of
the request, not what may be asked. The boundary that matters is the token,
and it is the operator's to hand out.

A `tools/call` runs the tool. It does not start a conversation in which a
model decides to run it — you already knew what you wanted, and a model in
the middle would cost money, take seconds, and answer differently each time.
Every call is executed and audited as you.

Calls arrive marked as confirmed. Your harness asks you before it runs a
tool, and there is no card this server could show that would reach you; the
credential you handed the harness is what says you meant it. Anything a tool
marks untrusted is wrapped before it goes back, the same way the agent's own
loop wraps it — the harness hands it to a model of its own, which needs
telling as much as ours does.

### Asking the agent, rather than driving it

`teanode_ask` takes a question in words and returns your agent's answer, with
the whole of its kit and its memory of you behind it. A harness that would
otherwise orchestrate six calls asks once.

It is bounded by what a harness will wait for rather than by what a turn
takes. Most give a tool call about a minute. After 55 seconds this one
returns whatever has been said so far and names the conversation; the turn
carries on, and calling again with that conversation and no question collects
the rest. A turn that finished in the meantime is handed back and replays
what it said, so coming back late still hears the answer. Ten minutes after a
run ends the conversation itself is where the answer is.

A turn that stops to raise a confirmation card cannot be answered from a
harness. The answer says so, and says the card is waiting in the dashboard,
rather than looking like an answer that simply stopped.

### Two tools are left out

`ask_user` exists to put a question in front of somebody who is watching.
There is a person at the far end of a call, but they are looking at their
harness, and this server cannot draw on it. A tool that reaches for it gets
an error saying so rather than a guessed answer.

`tool_search` exists to keep a long catalogue out of a model's request until
it is wanted. A harness lists the tools once and keeps the list, so it is
better served by the list.

## Connecting out: servers your agent uses

The other direction. An operator declares a server — a name, an address, and
how people authenticate with it: nothing, a shared credential, each person's
own, or OAuth. You then connect your own credential, or authorize in a
browser for a server using OAuth. Credentials are sealed with the server
secret before they are stored.

    teanode agent mcp list
    teanode agent mcp connect tracker --credential -
    teanode agent mcp disconnect tracker

What comes back is namespaced by the server's name and joined into your
catalogue. Each server's tool list is held for five minutes, and three
failures in a row withdraw a server's tools until the next interval, so one
service being down does not take your agent's whole kit with it.

A tool from a connected server needs your word before it runs, unless the
operator listed it as read-only. Everything such a server returns is data. It
never instructs.

## Pointing it at itself

Nothing stops an operator declaring this server's own endpoint as one of the
agent's connected servers, which would give the agent a namespaced copy of
its own catalogue and a call that comes straight back out. The handshake
refuses a client that says it is TeaNode, which is what our own client says,
and `teanode_ask` is never in the agent's own catalogue, so even a loop past
the first guard cannot recurse through it.

## What to read next

- [Agents](/doc/agents) is the personal agent itself: what it needs, what it
  does with a mailbox, and what an operator turns on.
- [Memory](/doc/memory) is what it knows about you, which is what stands
  behind `teanode_ask`.
- [The command line](/doc/command-line#teanode-agent) covers `teanode agent
  mcp` and the rest.
