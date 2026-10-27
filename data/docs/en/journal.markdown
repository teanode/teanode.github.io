Your server already holds most of what happens in a day: the photos you took,
the places your phone stopped at, the mail that came in, the meetings you
recorded, your calendar, the money you spent, your coding sessions, your
steps and sleep, the shopping you did. The **Journal** puts each day back
together: one page per day that links all of it in the order it happened,
with three things only a journal has. Your own **words**, the day's **mood**
and **weather**, and the **story** your agent writes of it.

## A day

Open **Journal** on the dashboard, or in the iPhone app under **More** (and
make it one of your tabs if you like). The timeline lists your days, newest
first, each with its headline, mood and a photo. Opening a day shows:

- **Your words**, what you want to remember, in your own voice.
- **Your mood**: Awful, Low, Okay, Good or Great, and a few words if you
  like. A State of Mind you logged in Apple Health shows until you choose.
- **The weather**, for the place you spent most of the day.
- **The story**: a headline and a few paragraphs your agent wrote, each
  mention a link to the photo, mail or visit it names.
- **What happened**, read live from each part of TeaNode: a deleted photo
  disappears from the day, and a corrected charge shows corrected.

A day links, it never copies. Only the words, the mood, the weather, the story
and a few numbers for the timeline are kept by the journal itself.

## Your words are yours

TeaNode never changes what you write. If you want help, ask it to **touch
up** a day's words, optionally saying how ("shorter", "fix the grammar"). The
touched-up version is shown, marked as such, with your original a tap away;
you only ever edit the original, and the touched-up text is made again from
it. Turn touching up off and it is gone.

Any past day can be changed at any time, and its story is written again.

## The story

During its background memory runs ("dreams") your agent writes each day's
story from that day's records, your words, your mood and the weather. It
picks the mail, documents and work messages that mattered, says why in a few
words, and counts the ones it left out. Every mention it makes is checked
against the day's records, so a story cannot name something that is not
there. Today is never written; the timeline shows a line built from the day's
numbers instead.

If the story gets something wrong, choose **Something wrong?** and say what,
in your own words ("it was Sam at lunch"). The correction is kept with the day
and every later telling follows it. You cannot edit the story by hand, but you
can have it written again or delete it.

Stories are written on their own for the last three months. An older day
shows its links, numbers, weather and your words, and you can ask for its
story from its page.

## Weeks, months and years

Zoom out to a **week** (seven days side by side), a **month** (a calendar of
days with a photo, mood and temperature each) or a **year** (twelve small
calendars colored by mood). Each has its own story, written from the days in
it, and room for your own **looking back**.

## What your agent reads

The journal's page reads everything that is yours. Your agent reads a day
only from what you gave it: the mailboxes and calendars granted to it, the
chats it may remember, the finance sources that are on, and Health only when
you let it read Health. The model your server uses sees the whole day, your
words included, and the page says so. Asked "what did I do last Thursday?",
it answers from the journal, but only in a conversation you started.

In the evening TeaNode can ask "How was today?", at 9 PM unless you change
it. The weather comes from a weather service at your day's place rounded to
about 11 km; both can be turned off under the Journal's settings.

## Erasing

**Erase** removes every day, week, month and year: words, moods, weather,
stories, corrections and the memory pages made from them. Nothing the days
linked to is touched. Erasing Health or location history also forgets the
stories written from them.

On the command line it is `teanode journal`: `day`, `week`, `month`, `write`,
`mood`, `touch-up`, `correct`, `search` and the rest; `teanode journal --help`
lists them.
