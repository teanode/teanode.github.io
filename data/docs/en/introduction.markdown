TeaNode gives every side project and every early startup a real address at
its own domain.

It is a small self-hosted mail server. It receives mail for all of your
domains over SMTP, checks that it is genuine (SPF, DKIM, DMARC, ARC),
optionally scans it for viruses and spam, and then either files it in a
mailbox here or hands it on — to an inbox you already read, to a webhook, or
to another mail server. It also lets you reply and send from those addresses,
signed with the domain's key so the mail arrives rather than landing in spam.

A mailbox is read in the dashboard or in any mail program over IMAP. An
address that should not have a mailbox forwards instead, and one domain can
do both.

## Why

Running mail for a domain usually means either handing it to a provider, or
assembling Postfix, Dovecot, OpenDKIM, OpenDMARC, SpamAssassin and a policy
daemon and keeping them in agreement. This is one executable and a PostgreSQL
database, with the authentication that decides whether your mail is trusted
built in rather than bolted on.

## What it looks like

The dashboard is compiled into the binary; there is nothing else to deploy.
It opens on your mailbox, and the pages that run the server are a mode behind
**Manage**, which shows only what your permissions allow.

<figure>
<img src="screenshot:mailbox" alt="A mailbox, with a message open" width="1505" height="812" loading="lazy">
<figcaption>A mailbox, with a message open.</figcaption>
</figure>

On the management side, every message this server has handled, what it decided
about each one, and — for mail sent from a template — whether the recipient's
mail program fetched the pictures in it. Clicking a row shows the
authentication verdicts with the evidence behind them, every delivery attempt
and why any of them failed, and the message itself with scripts stripped.

## What you need

- A domain, and the ability to edit its DNS
- A host with a stable address, reachable on ports 25, 80, 443 and 587, and
  on 993 if mail programs are to read the mailboxes
- PostgreSQL, for the configuration, the mailboxes and the mail it has handled

Nothing else. No AWS account. Certificates are obtained
automatically over HTTP-01, so there is no DNS API to configure. An
S3-compatible object store is optional, and only worth having if you run more
than one instance: it is what lets them share the stored messages.

## What it does

**Mailboxes.** Every account has one. Folders nest to any depth and can be
renamed, moved and pinned; search covers one folder or the whole mailbox,
with sender, recipient, subject, date and attachment filters; rules file mail
as it arrives, and can be run over mail already filed. There are drafts whose
attachments upload once, a signature, contacts kept from whoever you write
to, and an out-of-office reply that knows not to answer machines, mailing
lists or another mailbox that is also away. A message is stored once however
many folders hold it, and kept for as long as one of them does.

**IMAP.** Port 993, and STARTTLS on 143, so a mail program reads the same
mailbox. Each device gets an app password of its own, which signs in to IMAP
and sends through the submission port on 587 as any of the mailbox's
addresses.

**Authenticates everything.** SPF, DKIM, DMARC and ARC on the way in, with the
results shown per message. Your outbound mail is DKIM signed, and forwarded
mail keeps an ARC chain so it still passes at the far end.

**Forwards flexibly.** Aliases match the address with a regular expression and
deliver into a mailbox, or send the message to an address, an HTTP endpoint,
or another mail server. An empty pattern is a catch-all, which receives
whatever nothing else matched.

**Relays your outbound mail.** Per-device SMTP credentials on the submission
port, each optionally restricted to one sender address.

**People, groups and roles.** Permissions decide what each person sees:
Administrator, Operator and Member come seeded and all of it is editable, and
a group can be tied to a domain so its permissions reach only that far.
Single sign-on through an OpenID Connect provider follows a group in your own
directory. Every change to a user, group, role, domain, alias, credential or
mailbox is in the audit log.

**Shows you the mail.** The dashboard renders a message as a message: the
authentication verdicts, the delivery attempts and why any of them failed, and
the body itself with scripts stripped and remote images blocked until you ask
for them.

**Sends mail you write.** Templates with variables and translations, a layout
around them, pictures served from your own domain, and a record of whether the
recipient's mail program fetched them.

**Reports on your domains.** Incoming DMARC aggregate reports are parsed and
kept, which is how you find out somebody is forging your domain.

**Scores spam without a second program.** The filter inside the server reads
what it already established about a message — the SPF, DKIM, DMARC and ARC
results, the sending host's confirmed reverse DNS name, the name it gave in
HELO — consults public block lists over DNS, and applies a classifier trained
on the mail you mark in the dashboard. An external SpamAssassin daemon is
still supported for deployments that want one.

**Optional extras, all off by default.** ClamAV, GeoIP, an S3 mirror of stored
messages, an outbound SOCKS5 proxy for hosts whose address has a poor
reputation, and DNS-01 certificates if you need a wildcard.

## How a message gets through it

1. The SMTP listener speaks the protocol, optionally does STARTTLS and
   authentication, and produces an envelope.
2. The envelope picks one of four paths: a signed bounce or report address
   means a delivery status notification or a DMARC aggregate report; a
   credential means outbound submission; anything else is inbound mail.
3. Inbound mail is checked — SPF, DKIM, DMARC and ARC in parallel, then the
   optional virus and spam scans — and recorded with what each check decided.
   The recipient's local part is matched against that domain's aliases, and
   one delivery is created per match: a mailbox, an address elsewhere, a
   webhook, or another mail server.
4. A mailbox delivery files a reference to the stored message, applies the
   mailbox's rules, and updates the unread counts. A delivery elsewhere is
   signed with the domain's key and relayed; one that fails is retried on a
   fixed backoff ladder, and the queue page says why in the remote server's
   own words.

Every step is a place the dashboard can show you what happened, which is the
point of recording it.

## Configuration

Settings live in the database, so several instances share one answer and a
change made in the dashboard reaches all of them. Domains, aliases,
credentials and accounts are rows, managed one at a time. The environment
says only where that database is; everything else is stored.

    teanode domain create example.com
    teanode alias create example.com --pattern '^you$' --kind mailbox --mailbox <mailbox id>
    teanode alias create example.com --pattern '^hello$' --kind email --email you@example.net

[The command line](/doc/command-line) reaches the whole API, and
[Configuration](/doc/configuration) documents every setting.

## Where to go next

- [Getting started](/doc/getting-started) walks through one domain, from
  nothing to mail arriving in a mailbox you can read in a mail program,
  including the DNS records and the reality that many providers block
  outbound port 25.
- [Deploying](/doc/deploying) covers the container image and the compose
  file.
- [The command line](/doc/command-line) reaches the whole API, and is the
  better tool for anything repetitive.
- The source is on [GitHub](https://github.com/ziyan/teanode), under the MIT
  licence.
