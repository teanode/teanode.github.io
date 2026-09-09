There are two ways to run TeaNode: the container image, or the two binaries
on a host. Both are built from every release and both include the dashboard,
so there is nothing else to deploy.

The [quick start](/doc/quick-start) gets the container running in four
commands. This page is about what is in the compose file, how the server
upgrades, and what to back up. [Getting started](/doc/getting-started)
covers the binaries.

## The image

    docker pull ghcr.io/ziyan/teanode:latest

The image contains the server, the client and the dashboard, and nothing
else: no shell and no package manager. It runs as user 65532 rather than
root, with only the `CAP_NET_BIND_SERVICE` capability so that it can bind
ports 25, 80, 443 and 587, and 993 and 143 for IMAP.

Pin a version rather than following `latest` on a server people depend on.
Upgrading should be something you decide to do.

## The compose file

[`deploy/docker-compose.yml`](https://github.com/ziyan/teanode/blob/main/deploy/docker-compose.yml)
in the repository is a complete deployment: the server, PostgreSQL, and the
optional services. Copy it next to a `.env`, describe the server, and start
it:

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com > .env
    chmod 600 .env
    docker compose up -d

Set `TEANODE_TLS_ACME_EMAIL` in `.env` before the first start: it is the
address the certificate authority uses to warn you about an expiring
certificate.

Port 80 has to be reachable from the internet, because that is where the
certificate authority puts its challenge. It answers those challenges and
sends everything else to HTTPS: the dashboard is never served in the clear,
and the answer carries `Strict-Transport-Security`, so a browser that has
been here once will not try plain HTTP again.

The server uses the host's network rather than a Docker network. SPF checks
the address a mail server connects from, and behind a Docker bridge every
sender would appear to come from the Docker gateway.

### Mail programs

IMAP is served on 993 with TLS, and on 143 with STARTTLS, when
`TEANODE_LISTEN_IMAPS` and `TEANODE_LISTEN_IMAP` are set; `config env` writes
them as `:993` and `:143`. Since the container shares the host's network,
those two ports need opening in the firewall or security group beside 25,
587, 80 and 443. A server set up before they existed turns them on under
**Server → Listeners** and restarts, because the environment only describes a
first run.

The connection to PostgreSQL is encrypted and verified. The official
PostgreSQL image serves no TLS, so the compose file generates a certificate
and starts PostgreSQL with it, and the `TEANODE_DATABASE_URL` that
`config env` writes asks for `sslmode=verify-full` against that certificate.
Pointing at a PostgreSQL of your own means pointing `sslrootcert` at that
server's authority instead, or dropping to `sslmode=require` to encrypt
without checking who answered.

### What runs beside it

- **PostgreSQL** holds the configuration and everything the server has
  handled: mailboxes and what is in them, mail, deliveries, DMARC reports,
  usage counters, templates, and who may do what. It is what you back up.
- **ClamAV** scans mail for viruses. The compose file starts it, but the
  server does not use it until it is switched on in the settings. Remove the
  service if you do not want it; it needs about 2GB of memory.
- **Spam** is scored by a filter inside the server, which needs no second
  program. An external SpamAssassin daemon is still supported and is behind
  the `spamd` profile: `docker compose --profile spamd up -d`, with
  `antispam.engine` set to `spamd`.
- **MinIO** and **Redis** are only for running more than one instance, and
  are behind the `cluster` profile. MinIO holds the raw messages so that every
  instance can read what any of them received. Redis holds passkey sign-ins
  that are half done, because behind a load balancer the second request may
  land on a different instance from the first.

### The data directory

`./data/teanode` is mounted at `/var/lib/teanode` and holds what the server
writes outside the database: the message spool, the GeoIP database if you use
one, and a staged upgrade. It must be readable and writable by user 65532.
If an earlier version ran as root, the directory is owned by root and the
server cannot read it; fix that once:

    chown -R 65532:65532 ./data/teanode

## Upgrading

The dashboard checks for new releases every six hours and shows the newest
one on **Settings → Server**, with its release notes. Installing from there
downloads the binary, checks it against the release's checksums, replaces the
running binary and restarts.

In a container the new binary cannot replace the one in the image, because
the image is discarded on the next `docker compose up`. Instead it is saved
on the volume, in the directory named by `TEANODE_UPGRADE_DIRECTORY`, and the
next start runs it from there. If a new release fails to start, the container
falls back to the binary in the image and reports why.

You can remove that variable. Upgrading from the dashboard then stops
working, and `docker compose pull` is how you upgrade.

Automatic upgrades are off by default. A release can change how mail is
handled, and a mail server should not change without you knowing. Turn them
on with `upgrade.automatic`, and limit them to a time of day with
`upgrade.window`. See [Configuration](/doc/configuration#upgrade).

## Settings that need a restart

The listeners, TLS, the object store, the data directory and the optional
services are read once, when the process starts. Changing one of them saves
the change, but it has no effect until the instance restarts. The dashboard
tells you which settings are waiting and offers to restart. So does
`teanode server restart`.

A restart means the process exits and whatever supervises it, the container
restart policy or systemd, starts a new one. Mail that was already accepted
is on disk and is delivered afterwards. A sender that connects during the few
seconds in between retries.

## What to back up

The database. Along with the mail, it holds the configuration and the
secrets: the DKIM signing keys, the server secret that every SMTP password is
derived from, the session key, and the ACME account key and certificate.

There is also a file form:

    teanode-server config export --file backup.yaml

This writes the whole configuration, secrets included, in the format
`config import` reads. Only you can read the file. Keep it somewhere other
than the server.

The message spool on disk is kept for `storage.spoolRetention` and then
deleted. It only holds the message bodies of the last few days, so it is not
usually worth backing up.

## More than one instance

Several instances can run against one database. They share the configuration
through PostgreSQL, the stored messages through the object store, and
passkey sign-ins through Redis. Give each one its own `TEANODE_INSTANCE_ID`.
It is part of the key the usage counters are stored under, and two instances
with the same name overwrite each other's counts.

    docker compose --profile cluster up -d

starts MinIO and Redis as well. Uncomment the `TEANODE_S3_*` block in `.env`
at the same time. The credentials there are the ones MinIO is started with.
