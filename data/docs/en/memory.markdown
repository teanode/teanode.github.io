An agent that forgets you between conversations is a search box with
manners. This page is what your agent keeps, how it gets there without you
asking, where else it reads from, and what it does with all of it while
nobody is talking to it.

None of it happens until you turn your agent on and grant it something. What
is written here describes a switch you threw.

## The shape of it

What your agent knows is a **graph of pages**, not a list of notes.

A **page** is something your life has a name for: a person, a project, an
organization, a place, a thing, a topic, a stretch of time. It lives at a
path — `people/alice-chen`, `projects/greenfinch`, `time/2026/09` — and that path is
its address everywhere: in the prompt, in a citation, on the command line,
and in the dashboard's own URL.

A **fact** is one sentence on a page, numbered. `people/alice-chen#3` is the
third thing your agent knows about Alice, and that is how it cites her in an
answer and how you find the line again. Numbers are never reused, so striking
#3 does not hand that number to the next thing written. Every fact carries
the words it came from and what they came from — a conversation, a message, a
file — so a line can be checked; the dashboard says which lines can and which
cannot.

A fact carries two dates, because they answer different questions: when it
was true, and when your agent learned it. "They moved to Osaka" happened in
2019 and was learned last Tuesday, and a question about 2019 wants the first.

A **link** joins two pages and says how. Not "related": `works_on`,
`member_of`, `knows`, `owns`, `uses`, `located_in`, `decided_in`, `about`,
`part_of`. Each reads both ways round — the link from Alice to a project
says "works on" from her page and "is worked on by" from the project's — and
a link nothing has touched in a long time is said in the past tense, which is
the smallest honest way to show it may no longer be true.

You read and correct all of it on **Settings → Knowledge**, and everything
there is on the command line too:

    teanode agent memory index                      # the top of the graph
    teanode agent memory get people/alice-chen
    teanode agent memory note projects/greenfinch "Terms moved to ninety days"
    teanode agent memory link people/alice-chen projects/greenfinch --relation works_on
    teanode agent memory move notes/kittiwake things
    teanode agent memory history projects/greenfinch

## It writes without being asked

The first version of this asked the model to write memory during a turn. Over
456 turns on a real server it wrote two, and both were tests. Given a task
and a memory tool, a model does the task.

So writing is not in the turn. A job runs once a conversation goes quiet,
reads what was said, and files what it taught: pages found or made, facts
added with their quotes, links drawn. It knows where it got to, so it never
reads the same exchange twice and never skips one. What you said on Tuesday
is there on Wednesday.

Nothing is filed twice under two names. Every writer goes through one
resolver that looks for an existing page three ways before making one — by
path, by name or alias among the pages under the same parent, and by meaning
— because a graph's real failure is not forgetting, it is ending up with
"Portal", "the portal", `projects/portal` and `work/portal` as four pages
that each know a quarter of it.

## Where else it reads from

Conversations are not where most of what you know lives. Point your agent at
where it does, and it keeps a searchable, citable copy:

| kind | what it is |
| --- | --- |
| `computer` | a checkout or a folder on a computer you have attached |
| `archive` | a chat export, or a folder of dated notes |
| `skill` | anything an installed skill can list: a wiki, an issue tracker |
| `web` | a site you name, within the prefixes you allow, to a depth you set |
| `sent` | your own sent mail |

    teanode agent knowledge add "work" ~/work --computer laptop --under work
    teanode agent knowledge sync work
    teanode agent knowledge pause work      # stop reading, keep what it found

A `computer` source is read **on the computer**. The walking, the sniffing
and the refusing all happen in the daemon you run on your own machine, and
only text that passed the filter crosses the socket. Inside a repository the
manifest is what git tracks, so a build tree nobody committed is never read.
A file is text when it decodes as text, not when its extension says so. A
file whose name looks like a key or an environment file is refused, and so is
any passage that looks like a private key, a token or a credential — refused
on the machine, counted, and named in the source's log, so a mistake in the
server cannot widen it.

Everything read from a source is data, never instructions. It reaches the
model the way a fetched web page does.

Which commits are **yours** is decided by the addresses on the contact card
you have marked as yourself, so mark one: `teanode contact me <id>`. A source
that finds commits by addresses it cannot place lists them and points you at
the address book, rather than quietly attributing none of your work to you.

## What it does at night

When you have been quiet for half an hour, inside hours you set, and not more
than once every six, your agent works over its own graph. It has its own
share of the day's budget — thirty per cent by default — so it never eats
your day, and it never deletes anything.

It reads what arrived, newest and most yours first: what you wrote, then what
you took part in, then the rest. A chat archive is read only where you were
in the thread; a quarter of a million other people's conversations is years
of reading and none of your business, so they stay searchable and unread.

It writes up the month. `time/2026/09` is a page like any other, built from a
digest assembled without a model at all — commits by repository, the threads
you took part in, your own notes, with the noise dropped — and then written
up in your own words. That is one call a night for the month in hand.

It rewrites the pages that changed, merges facts that say the same thing, and
divides a page that has outgrown itself into themed children. It reweighs the
links: every link is downscaled a little, then any link whose both ends you
used today rises, so a link used today ends the night above where it started.
Facts nothing has wanted in half a year stop arriving uninvited — they are
still there when you search.

Then it walks the graph from what matters, five steps, and asks whether two
pages that are connected but not adjacent have a real relation. "No" is the
ordinary answer. When it is "yes" a link is written with the sentence that
justifies it, at half the weight of one you stated: it earns the rest by
being useful. This is the only part that adds a relation nobody typed, and it
is the whole reason to keep a graph rather than a list.

Last, it writes down the questions you are most likely to ask tomorrow, tries
each against its own memory, and records the ones it could not answer. Nobody
reads the answers; the failures are the point. A gap found at three in the
morning costs one model call. The same gap found mid-conversation is you
watching your agent say it does not know. Gaps are written down and never
filled — a run with nobody present inventing answers to its own questions is
how a graph fills with fiction.

    teanode agent dream log             # what the last ones did
    teanode agent dream now             # start one at the next tick
    teanode agent dream bootstrap on    # read everything, as fast as it can

Every call a night makes is an ordinary run you can open and read, and the
sentence at the top of the agent page says what last night came to.

## What it costs

A first ingest is years of record at once. Point `models.scan` at a model of
your own — an OpenAI-compatible server such as Ollama, llama.cpp or vLLM,
declared as a provider at zero price — and the reading costs nothing but the
machine's time. On a metered service the night is still bounded by its share
of the daily budget, and by the caps your operator set.

Searching by meaning uses the `pgvector` extension where the database has it,
and where it does not, everything works as before over a bounded candidate
set. The compose file ships an image that has it.

## Nothing is deleted

Every change files a revision against the page: what changed, who changed it
— you, the agent, the job that files conversations, the night, a source being
read — and what was there before. Without the "before" a history can be read
but not undone, which is the half you want at the moment you go looking.
Without the actor, a page the night wrote and a page you wrote look
identical.

A page the night retires is marked dormant, not deleted: out of the index,
still findable by search. Deleting is yours to do, and deleting a page
deletes what is under it.

Every page and fact also carries the build that last wrote it, so a rule
written today reaches a graph filled last month: the first thing a night does
is offer everything an older build wrote to the rules as they stand and strike
what fails them, in the page's history, with the words it used to say.

## Before you point it at something

Unless you are running the model yourself, it is a third party, and what your
agent sends it is what left your server. Three things follow.

Add one source and read what it made before adding the next. A source is a
decision about everything under a path, and turning on search by meaning
sends what is already there, not only what arrives next.

If the material is sensitive, point the agent at an Ollama or a vLLM of your
own. The same features run, the quality of the filing is down to the model,
and nothing leaves the machine.

Read `agent.features` before you open this to everybody. That is where an
operator says what people may turn on — an operator who wants sorting but not
knowledge sources should say so there, rather than relying on nobody
finding the switch.

## What to read next

- [Agents](/doc/agents) is the rest of the personal agent: what it needs,
  what it does with a mailbox, and what an operator turns on.
- [Configuration](/doc/configuration#agent) records every key under `agent`,
  including `agent.limits`, the dream's share, and the scan model.
- [The command line](/doc/command-line#teanode-agent) covers `teanode agent
  memory`, `knowledge` and `dream` in full.
