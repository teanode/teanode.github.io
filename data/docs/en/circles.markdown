A server usually has people on it who know each other: a household, a few
friends, a team. A **circle** says who belongs together. On its own it shares
nothing; it is the list that chats, calendars, albums, memory, skills and
location ask when somebody wants to share with "my family".

Everyone keeps their own account, their own mailbox and their own agent. A
circle never lets one person read another's mail or conversations, an
operator included. What crosses between people is only what its owner chose
to share, and leaving a circle ends every share that depended on it at once.

## Making a circle

Open **Circles** from the account menu at the foot of the rail, or in the
phone app's side menu, and make one with a name and a kind: family, friends
or colleagues. The kind is only how screens describe it.

- **Somebody with an account** is invited by username, and joins when they
  accept. The invitation waits on their Circles page, in their agent's
  conversation and on their phone, and expires after thirty days.
- **Somebody with no account yet** is added with **Make an account for
  someone**, by an operator: a username, a name and a first password, and they
  are in the circle at once.

Each member is an admin or a member. Admins rename the circle, invite and
remove people, and decide who else is an admin; a circle always keeps one.
Anybody may leave. A role never decides what anybody sees of anybody else:
that is always the owner's choice.

From the command line:

```bash
teanode circle create --kind family Family
teanode circle invite <circle-id> sam
teanode user create --circle <circle-id> alex
```

## Chats

Once two people share a circle they can message each other. Chats live in the
same drawer as your agent, and in the phone app's Chats: start one with
**New conversation**, then **Message someone** or **New group**. Every circle
also has a chat of its own, whose members follow the circle's.

A chat works with no model at all: messages, pictures and files, replies,
reactions, read marks and notifications on the phone. Agents join only when
somebody asks:

- **Your own agent** answers in a chat when you mention it with `@` or reply
  to something it said. What it reads and does there is shown only to you.
- **Somebody else's agent** answers you only if its owner allowed it in that
  chat, and then only from the chat and the web, never from its owner's mail,
  calendar or memory.
- **Under your own name**, when you ask: your agent, a program you connected
  over MCP, or `teanode agent conversation say` can write in a chat as you,
  mentioning people with `@`. In your own conversations it asks first, and
  the card says whose name the words go under.

### Calls

Anyone in a chat can call it, as a voice call or a video call, from the
telephone at the top of the chat. Everybody else in it is rung: a phone
rings as for any call, even when it is locked, and so does any dashboard they
have open. Somebody who set the chat's notifications to off is not rung. In a
group you can choose who is rung instead, and the others can still join from
the banner the chat shows while the call goes.

Each person turns their own camera on and off, and whoever has muted their
microphone is marked beside their name. From five people, or once you tap
somebody, one person is shown large above a row of the rest: whoever is
speaking, or the one you chose. Only that picture comes to you at full size,
so a big video call uses little data.

Anyone on the call can turn on a transcript, which then covers everybody and
says who turned it on; the transcript and a summary go into the chat when the
call ends. The server carries the call's sound and pictures itself, with no
outside service, so its call port has to be reachable from the internet: see
`calls` in the [configuration](/doc/configuration#calls).

### Voice messages

The waveform button beside the message box switches it to voice. Hold **Hold
to talk**, let go to send, or slide up to cancel; a message is up to two
minutes long. Everybody in the chat can play it, and its words appear under
it, written by the sender's agent. When the sender has no agent, anyone in the
chat can press **Transcribe**, and their own agent writes the words for
everybody. The microphone in the message box is dictation instead: what you
say is typed into the box, and nothing is sent until you send it.

## Sharing

Each kind of thing is shared with one person in a circle, or with a whole
circle, at a level its owner picks.

- **Calendars**, at busy, titles, details or edit. A circle can also keep a
  calendar of its own, and **Find a time** looks across everyone's. An event
  marked private stays busy whatever the level.
- **Albums**, to look at or to add to, with or without where the photos were
  taken. See [Photos](/doc/photos).
- **Where you are**, now or now and where you have been. See
  [Location](/doc/location).
- **Finance**, one account at a time or all of it at once, at the spending or
  the transactions level. See [Finance](/doc/finance).
- **Pages of memory**, read only, with or without the words each fact came
  from.
- **A skill that costs money**, with a limit per payment and per month;
  anything above the limit waits for the owner, who approves it on the
  dashboard or in the phone app.

## Who is who

In a circle you can say what somebody is to you: Sam is my father. Sam sees
the other side at once (you are Sam's son, daughter or child) and is told.
Either of you can change it or take it away, and only the two of you see it.
On your profile you can say how you are described, he, she or they; until you
do, the words for you are neutral.

Your agent knows these, so "ask my father whether Sunday works" or "where is
my wife" reaches the right account, and it never guesses a relationship or a
pronoun. On the command line they are `teanode circle relate`,
`teanode circle unrelate` and `teanode user update --pronoun`.
