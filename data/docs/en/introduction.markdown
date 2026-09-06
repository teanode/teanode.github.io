TeaNode gives every side project and every early startup a real address at
its own domain, without running a mailbox for each one.

It is a small self-hosted mail server. It receives mail for all of your
domains over SMTP, checks that it is genuine (SPF, DKIM, DMARC, ARC),
optionally scans it for viruses and spam, and forwards it wherever you say —
to the inbox you already read, to a webhook, or to another mail server. It
also lets you reply and send from those addresses, relaying outbound mail from
your own devices signed with the domain's key so it arrives rather than
landing in spam.

It is deliberately **not** a mailbox server. There is no IMAP and no inbox.
Keep reading mail wherever you read it now; TeaNode owns the domain, the
authentication and the routing.

## Why

Running mail for a domain usually means either handing it to a provider, or
assembling Postfix, Dovecot, OpenDKIM, OpenDMARC, SpamAssassin and a policy
daemon and keeping them in agreement. This is one executable and a PostgreSQL
database, with the authentication that decides whether your mail is trusted
built in rather than bolted on.

## What it looks like

The dashboard is compiled into the binary; there is nothing else to deploy.

<figure>
<img src="screenshot:mail" alt="The mail list, filtered to one domain" width="1505" height="812" loading="lazy">
<figcaption>The mail list, filtered to one domain.</figcaption>
</figure>

Every message this server has handled, what it decided about each one, and —
for mail sent from a template — whether the recipient's mail program fetched
the pictures in it. Clicking a row shows the authentication verdicts with the
evidence behind them, every delivery attempt and why any of them failed, and
the message itself with scripts stripped.

## What you need

- A domain, and the ability to edit its DNS
- A host with a stable address, reachable on ports 25, 80, 443 and 587
- PostgreSQL, for the configuration and the mail it has handled

Nothing else. No AWS account. Certificates are obtained
automatically over HTTP-01, so there is no DNS API to configure. An
S3-compatible object store is optional, and only worth having if you run more
than one instance: it is what lets them share the stored messages.

## What it does

**Authenticates everything.** SPF, DKIM, DMARC and ARC on the way in, with the
results shown per message. Your outbound mail is DKIM signed, and forwarded
mail keeps an ARC chain so it still passes at the far end.

**Forwards flexibly.** Aliases match the address with a regular expression and
send the message to an address, an HTTP endpoint, or another mail server. An
empty pattern is a catch-all, which receives whatever nothing else matched.

**Relays your outbound mail.** Per-device SMTP credentials on the submission
port, each optionally restricted to one sender address.

**Shows you the mail.** The dashboard renders a message as a message: the
authentication verdicts, the delivery attempts and why any of them failed, and
the body itself with scripts stripped and remote images blocked until you ask
for them.

**Sends mail you write.** Templates with variables and translations, a layout
around them, pictures served from your own domain, and a record of whether the
recipient's mail program fetched them.

**Reports on your domains.** Incoming DMARC aggregate reports are parsed and
kept, which is how you find out somebody is forging your domain.

**Optional extras, all off by default.** ClamAV, SpamAssassin, GeoIP, an S3
mirror of stored messages, an outbound SOCKS5 proxy for hosts whose address has
a poor reputation, and DNS-01 certificates if you need a wildcard.

## How a message gets through it

1. The SMTP listener speaks the protocol, optionally does STARTTLS and
   authentication, and produces an envelope.
2. The envelope picks one of four paths: a signed bounce or report address
   means a delivery status notification or a DMARC aggregate report; a
   credential means outbound submission; anything else is inbound mail.
3. Inbound mail is checked — SPF, DKIM, DMARC and ARC in parallel, then the
   optional virus and spam scans — and recorded with what each check decided.
   The recipient's local part is matched against that domain's aliases, and
   one delivery is created per match: a mailbox, a webhook, or another mail
   server.
4. Outbound mail is signed with the domain's key and relayed. A delivery that
   fails is retried on a fixed backoff ladder, and the queue page says why it
   failed in the remote server's own words.

Every step is a place the dashboard can show you what happened, which is the
point of recording it.

## Configuration

Configuration lives in the database, so several instances share one answer and
a change made in the dashboard reaches all of them. The environment says only
where that database is; everything else is stored.

```yaml
domains:
  - id: example.com
    domain: example.com
    subdomain: mail
    aliases:
      - id: 01K2ZQ7B8N6H4K2QDX8ZR5VTAE
        pattern: ^hello$
        kind: email
        email: you@example.net
      - id: 01K2ZQ7B8PA1M7CJW3YFB9SDQK
        pattern: ""            # catch-all
        kind: email
        email: everything@example.net
```

That is what `teanode-server config show` prints and what `teanode-server
config import` reads, so a whole server can be described in a file, put under
version control and loaded — but the running server's answer is the database.
[Configuration](/doc/configuration) documents every field.

## Where to go next

- [Getting started](/doc/getting-started) walks through one domain, from
  nothing to mail arriving, including the DNS records and the reality that
  many providers block outbound port 25.
- [Deploying](/doc/deploying) covers the container image and the compose
  file.
- [The command line](/doc/command-line) reaches the whole API, and is the
  better tool for anything repetitive.
- The source is on [GitHub](https://github.com/ziyan/teanode), under the MIT
  licence.
