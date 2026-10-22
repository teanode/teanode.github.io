Passwords keeps your logins, passkeys, one-time codes, cards and notes on your
own server, encrypted on your own devices. Your phone or your browser seals
each item before it is sent, so the server, whoever runs it and a stolen
backup see only sealed text: no site, no user name, no password. The one
exception is an item you choose to let your agent use.

## Setting it up

Open **Passwords** on the dashboard or in the iPhone app and choose a
passphrase. It is separate from your TeaNode sign-in and never leaves your
device. Setup also makes a **recovery key**: print it or save it somewhere
safe. A device asks for the passphrase once; after that the iPhone opens
Passwords with Face ID, and Chrome keeps it open for as long as you choose.

If you lose both the passphrase and the recovery key, nobody can open your
Passwords, the operator included. The only way on is to erase it and start
again, and the setup screen says so.

## What it holds

- **Logins**: a user name, a password, the sites it is for, a one-time code
  and passkeys.
- **Cards**: kept, shown and copied when you need them. Nothing fills a card
  for you.
- **Notes**: anything else you want kept sealed, such as the Wi-Fi at the
  cabin.

Every change keeps the version before it, and a deleted item can be restored
for a while.

## Where it fills

- **Chrome.** The TeaNode extension fills a login on its site, offers to save
  one after you sign in, makes up strong passwords, and makes and uses
  passkeys.
- **The iPhone.** Turn on TeaNode in Settings, General, AutoFill & Passwords,
  and Safari, Chrome and other apps offer its logins, passkeys and one-time
  codes. A passkey sign-in on a computer, through its QR code, can use it too.
- **The command line.** `teanode passwords` lists, shows, copies, adds and
  edits items, and makes up passwords.

## Bringing them in

`teanode passwords import pass` reads a `pass` store, one-time codes and
sites included. `teanode passwords import csv <file>` reads an export from
Chrome, Apple Passwords or Bitwarden. Both skip what you already have, and
`teanode passwords export` takes everything out again.

## Sharing

Share an item with one person in a [circle](/doc/circles) or with the whole
circle. It is sealed on your device for each of them, so only their devices
can open it. They can fill it, copy it and sign in with its passkey; only you
change it. Stop sharing and the item gets a new key, so what they kept
cannot open the next version.

Each person has a **safety code**, eight groups of four digits worked out
from their key. If you want to be sure the server gave you the right key for
somebody, compare codes with them in person or on a call. Nothing waits for
it, and if a person's key ever changes, your devices tell you.

## Your agent

Your agent cannot read Passwords. For one login at a time you can turn on
**Let the agent use this**, and then it can sign in with that login for you:

- only on that login's own sites, checked by the browser, never by what the
  model says;
- in its own browser or in your Chrome tab, with the password, one-time code
  or passkey put into the page by TeaNode, never shown to the model;
- only in a conversation you started or a schedule you wrote yourself. A run
  that a mail, a webhook or a chat app started cannot use it.

Each use is recorded on the item, with the site. A note you turn on is read
by the model in full, since that is what you chose. A card can never be
turned on, and nobody's agent can use an item somebody else shared with you.

The agent can also make up a password when you ask, but for a login you
will keep, make it with the generator in Passwords, which no model sees.

On the command line it is `teanode passwords`; `teanode passwords --help`
lists every command.
