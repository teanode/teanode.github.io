Press the telephone beside send in the chat drawer and talk. What you say
streams through your server to the provider's transcription as you say it,
each thing you finish saying goes to your agent as an ordinary turn, and the
answer is read back to you as it is written. It is a phone call with your
agent, on any page of the dashboard, from a laptop or a phone.

## What a call is like

While you talk, the box is replaced by five bars that follow your voice,
the words heard so far beside them, and a red handset to hang up. The
conversation stays on screen above it, so what was said is there to read
afterwards, and you can stop a call and carry on typing.

**It answers at once.** A call feels live when the other side answers
straight away. Before a lookup the agent says a few words ("Let me check")
so you are not left in silence, and while you talk at length it makes the
small sounds a listener makes. Where the operator configured a quicker
model for calls, that model answers, and hands a hard question (advice, a
calculation, several steps of reasoning) to the model typed turns use,
saying so first.

**It is written for the ear.** A spoken turn tells the agent the words were
transcribed, so a name may be misheard, and asks for the answer first, in a
few short sentences, with no tables or code, numbers said the way a person
says them, and a check before it acts on a name, a sum or a day it may have
misheard. Code blocks, web addresses and the buttons of suggested replies
are left out of what is read aloud.

**You can cut in.** Start talking over an answer and it drops to a murmur at
once, and stops if you keep going. The agent is told how much of the answer
you heard, so it never assumes you heard what you did not. Tap the bars to
cut an answer short. The speaker button stops reading answers aloud on that
device without ending the call.

**It does everything a typed turn does.** A spoken turn steers a turn
already running, answers an open question card, and reaches every tool your
agent has. A confirmation card is read out as needing your approval on
screen, since approving by voice is not done yet.

**Your voice, or its.** Each person picks the voice the answers are read in
on their agent's settings, with a sample to listen to, or tells the agent
mid-call to change it.

## Echo

On a phone the speaker sits beside the microphone, and the answer would be
heard back and taken for you. The browser's echo cancellation is asked for;
on top of it the drawer learns how loud the answer comes back, counts only a
voice well above that as you, and drops anything that repeats the words just
played. Headphones avoid the question entirely.

## Turning it on

Voice is the operator's to turn on, in `agent.voice`, on the Agents tab of
the server page or with `teanode settings`:

    teanode settings set agent 'voice:={"enabled":true}'

It uses a provider of kind `openai`, whose key never leaves the server: the
drawer talks to your server, and your server talks to the provider. The
transcription model, the speech model, the default voice, the pause that
ends what somebody is saying, and an optional quicker model for calls are
all in [Configuration](/doc/configuration#agentvoice). Transcription and
speech are counted against the agent's day like any model call, under the
kind `voice`, so the operator's limits apply.

## What it does not do yet

- Approve a confirmation card by voice.
- Keep listening across a dropped connection: the drawer says it stopped, and
  you press the telephone again.
- Talk in the browser extension's drawer, whose page has a microphone
  permission of its own.

## Next

- [Agents](/doc/agents) is the agent on the other end of the call.
- [Coding sessions](/doc/coding-sessions) is how a call can reach the coding
  agents on your computers.
- [`docs/subsystems/voice.md`](https://github.com/ziyan/teanode/blob/main/docs/subsystems/voice.md)
  says how it works in detail.
