Every account on a TeaNode server can have an agent of its own: something
that reads the mail that arrives, sorts it, writes drafts, and answers
questions about it. This page is what an operator turns on and what a person
then does with it.

Two switches stand between a model and anybody's mail, and both have to be
thrown by hand. An operator configures a model service and turns the feature
on, which by itself gives nobody an agent. Then each person turns their own
on, and grants it each mailbox separately. Until both happen, nothing about a
message is sent anywhere.

## What it needs

A model service. TeaNode speaks to OpenAI, Anthropic, Gemini, and anything
that answers the OpenAI API — which includes [Ollama](https://ollama.com/) on
the same machine, and that is the configuration where nothing leaves your
server at all.

Nothing else. The agent runs inside the same binary as everything else, and
the queue it works from is in the same PostgreSQL.

## Turning it on

As the operator, on the **Agents** tab of the server page: add a provider —
its kind, where it listens, and its key — and then say which model does which
work. `default` is required, `fast` is what the cheap work uses, and
`embedding` is what makes search by meaning possible. Test sits on the
provider's row.

    teanode settings set agent enabled=true
    teanode settings describe agent          # every key, with its type

The key is sealed with the server secret before it is stored, the way a
domain's signing key is: a database dump holds ciphertext, and a server
started with a different secret cannot read it and says so.

Then, as a person, on **Settings → Agent**: turn your agent on, and grant it a
mailbox. Granting is per mailbox, and so is everything below — you may want
sorting on one address and nothing at all on another.

## What it does

**Sorts what arrives.** A category, a priority, whether somebody is waiting on
an answer, a line of summary, and the things the message asks for. They show
as chips on the row, and there is a Priority view beside Starred. Your mailbox
rules can read what it decided — "category is newsletter, move to Reading" —
and those rules run once the sorting is done rather than at delivery.

**Summarizes and drafts.** A conversation past three messages gets a summary
folded above it, rewritten as the conversation grows. Replying, the composer
offers to draft one: you say what the reply should do, and the text lands in
the editor in your own voice and sign-off. Sending stays with you.

**Answers, if you let it.** A mailbox can let the agent reply on your behalf
under a policy you write: who it may answer, which kinds of message, when, how
long a reply waits, how many a day. Every reply is held in Drafts with a
banner to cancel it or take it over — and editing it is a takeover. Before
writing and again before sending it climbs the same ladder the out-of-office
reply climbs: never to a mailing list, a bounce, an automatic message, spam,
or a message not addressed to you.

**Answers your questions.** A drawer on every page of the dashboard, and
`teanode agent ask` from a terminal. It works through the same operations the
dashboard uses, as you, with exactly your permissions: it searches your mail,
reads it, files it, drafts, keeps your folders and rules. Anything it cannot
undo, and anything that leaves the server, stops at a card you approve or
decline.

**Reaches past the mailbox, if you let it.** Your contacts, so it can look
somebody up or keep somebody for you. Your own computer, attached with
`teanode computer`, where it runs a command or reads and edits your files as
you — only while you are present in the conversation, and asking first for
anything that changes the machine. Your own browser tab, through an extension,
so it can act on a page only you can sign into while you watch. The web, when
a search provider is configured. Calendars are meant to become a source the
same way; they are not one yet.

**Remembers.** Facts about you between conversations — who the accountant is,
how you sign, what never to answer automatically. It learns from your hands
too: a message you file somewhere other than where it sorted it becomes an
example the next run is shown.

## What it costs, and how to cap it

Every run is counted, and an operator can cap it in tokens or in money.
`agent.limits` holds `dailyTokensPerAgent` and `monthlyTokensPerServer`, and
`dailyCostPerAgent` and `monthlyCostPerServer` beside them; one person can be
given their own:

    teanode agent admin limit alice --cost 5

A money budget is priced at the prices each provider is configured with, per
model, so a deployment running a small model and a large one is charged
properly for each. Where both kinds of budget are set, whichever runs out
first stops the day. `agent.currency` says which three-letter code the amounts
are written in; it labels and formats rather than converts.

A person sees their own day as a ring in the head of the chat window, and the
operator sees use by day, kind, mailbox and model on the Agents tab of the
server page.

## What to think about before turning it on

A language model is a third party unless you are running one yourself. Mail
that reaches it is mail that has left your server, and the point of running
your own mail server is usually that it does not. Three things follow.

Grant it one mailbox first, and read what it does before granting another. A
grant is a decision about a whole mailbox, and switching search by meaning on
sends what is already there to be embedded as well as what arrives next.

Point it at an Ollama if the mail is sensitive. The same features work, the
quality of the sorting depends on the model you run, and nothing leaves the
machine.

Read `agent.features` before opening it to everybody. It says what people may
turn on at all, and an operator who wants sorting but not automatic replies
says so there rather than trusting everyone to leave a switch alone.

## Further reading

- [Configuration](/doc/configuration#agent) documents every setting in the
  `agent` section: providers, models, features, limits, retention, search,
  tools, the browser, and connected servers.
- [The command line](/doc/command-line#teanode-agent) covers `teanode agent`,
  which reaches all of it from a terminal.
