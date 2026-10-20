The TeaNode app on your iPhone can keep a record of where you go: each visit
to a place, from when you arrived to when you left, on a map of your day.
Your server keeps it, names the places, shares it with the people you choose,
and your agent reads it, so "when did I last go to the gym" or "is Sam home
yet" has an answer. Nothing is asked of the phone until you open Location in
the app and turn it on.

## What is recorded

- **Visits**, from the iPhone's own visit detection, also while the app is
  closed: a place, an arrival and a departure. Two visits to one place a few
  minutes apart are one visit.
- **Positions**, when you move about 500 meters, and live while the app is
  open. A phone that stays put sends nothing.
- **Places**, made for each new spot you stop at. Rename one, move it, change
  its radius, or label it home, work, school, family or gym, and the name you
  give is never replaced. **Check in** says by hand that you are at a place
  near you, and a place can be found by its address, which is how you set
  home without standing in it.

What the phone records waits on the phone only until your server has it, so a
day offline arrives whole when the network is back.

## Where the names come from

A new place is first named after its nearest city, from a table that ships
with the server, and then named properly by the server's place provider:
OpenStreetMap's public Nominatim service unless the operator sets another
(a Photon of their own) or none. The provider is sent the place's position
and nothing else: not your name, not the time, not your other places. The
dashboard's maps are drawn from OpenFreeMap's tiles, fetched through your
server, so your browser talks to nobody else; the iPhone app draws its maps
with Apple Maps. Both are set under `places` in the
[configuration](/doc/configuration).

## Sharing with your circle

Your location is yours. You share it with one person you share a
[circle](/doc/circles) with, or with the whole circle, at one of two levels:

- **Where I am now**: where you are and the place you are at, and nothing
  before it.
- **Where I am and where I have been**: also your visits, your places and
  your paths.

The people you share with see you on a map, live, on the dashboard and in the
app. When you arrive at or leave a place you named or labeled, they get a
notification ("arrived home"); a place the server only found a name for
tells nobody, and neither does a day the phone sends late. Leaving the circle
ends the share at once.

## Your agent

Your agent reads all of it with its `location` tool: where you are, where
you were, which places you go to, and where the people who share with you
are. Each day you have visits also becomes a short journal page that the
agent's dreams read, so it learns your routine. In a chat with other people
it speaks only of your own location, never of somebody who shared theirs
with you.

## Erasing

**Erase** takes away your positions and visits, for a day, a range or
everything, along with the places you never named or labeled. **Forget**
removes one place and its visits. What your agent already learned from those
days stays in its memory until you remove it there, and the screens say so
when you erase. Turning Location off in the app stops the recording.

On the command line it is `teanode location`, with `now`, `visits`, `places`,
`share`, `erase` and the rest; `teanode location --help` lists them.
