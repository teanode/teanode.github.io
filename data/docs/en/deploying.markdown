There are two ways to run TeaNode: the two binaries on a host, or the
container image. Both are built from every release, and both carry the
dashboard inside them, so there is nothing else to deploy.

[Getting started](/doc/getting-started) walks through the binaries. This page
is about the container, and about what any deployment has to think about:
what runs beside the server, how it upgrades, and what to back up.

## The image

    docker pull ghcr.io/ziyan/teanode:latest

The image carries the server, the client and the dashboard, and nothing else:
no shell, no package manager. It runs as uid 65532, not root, with only
`CAP_NET_BIND_SERVICE` so that it can bind ports 25, 80, 443 and 587.

Pin the version rather than following `latest` on a mail server somebody
depends on. An upgrade should be a thing you did, on a day you chose.

## The compose file

The repository's [`deploy/docker-compose.yml`](https://github.com/ziyan/teanode/blob/main/deploy/docker-compose.yml)
is a complete deployment: the server, PostgreSQL, and the optional services it
can use. Copy it and its `.env` somewhere, describe the server, and start it:

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest \
      teanode-server config env \
        --hostname mail.example.com --domain example.com > .env
    docker compose up -d

Edit `.env` before the first start: it needs a PostgreSQL to reach, which the
compose file provides at `postgres:5432`, and an address the certificate
authority can warn about expiry.

The server uses host networking so that it sees the real address of a
connecting mail server. SPF checks the connecting address, so behind a bridge
network every sender would appear to come from the Docker gateway and SPF
would be meaningless.

### What runs beside it

- **PostgreSQL** holds the configuration, the mail the server has handled, the
  deliveries, the DMARC reports, the usage counters and the templates. It is
  the thing to back up.
- **ClamAV** and **SpamAssassin** are optional scanners, on by default in the
  compose file and off by default in the server's settings. Remove the service
  and leave the setting off if you do not want one; ClamAV wants about 2GB of
  memory for its signatures.
- **MinIO** and **Redis** are only needed for more than one instance, and are
  behind the `cluster` profile. The object store is where the raw messages go
  so that every instance can read a message any of them handled; Redis is
  where a half-finished passkey sign-in waits, because behind a load balancer
  the browser has no reason to come back to the instance it started with.

### The data directory

`./data/teanode` is mounted at `/var/lib/teanode` and holds everything the
server writes that is not in the database: the message spool, the GeoIP
database if you use one, and a staged upgrade. It has to be readable and
writable by uid 65532. On a server that ran an earlier version as root it will
not be:

    chown -R 65532:65532 ./data/teanode

## Upgrading

The dashboard checks the release list every six hours and shows the newest
version on **Settings → Server**, with its release notes. Installing it from
there downloads the binary, verifies it against the release's checksums,
replaces the running one and restarts.

In a container the new binary cannot be written over the one in the image,
which is thrown away by the next `docker compose up`. So it is staged onto the
volume instead — `TEANODE_UPGRADE_DIRECTORY`, which the compose file sets to
`/var/lib/teanode/upgrade` — and the next start runs it from there. A release
that crashes before it finishes starting is recovered from automatically: the
container runs the binary in its image again and says why.

Removing that variable does not break anything. It turns off upgrading from
the dashboard, and `docker compose pull` remains the way.

Automatic upgrades are off by default, because a release can change how mail
is handled and nobody installs a mail server expecting it to change underneath
them. `upgrade.automatic` turns them on, and `upgrade.window` restricts them
to a time of day. See [Configuration](/doc/configuration#upgrade).

## Settings that need a restart

The listeners, TLS, the object store, the data directory and the optional
integrations are read once, when the process starts. Changing one of those
stores the change and nothing more until the instance restarts. The dashboard
says so, names the settings that are out of date, and offers to restart; so
does `teanode server restart`.

Restarting means the process exits and whatever supervises it — the
container's restart policy, or systemd — starts a new one. Mail already
accepted is on disk and is delivered afterwards, and a sender that connects
during the few seconds it takes will try again.

## What to back up

The database. It holds the configuration, including the DKIM signing keys,
the server secret that every SMTP credential's password is derived from, the
session key, and the ACME account key and certificate, alongside the mail.

A backup that left the secrets out would not restore a working server, so
there is a second form:

    teanode-server config export --file backup.yaml

writes the whole configuration, secrets included, in the same format that
`config import` reads. The file is readable only by you. Keep it somewhere
that is not the server.

The message spool on disk is kept for `storage.spoolRetention` and then
removed; it is not worth backing up unless you would miss the message bodies
of the last few days.

## More than one instance

Several instances can run against one database. They share the configuration
through PostgreSQL, the stored messages through the object store, and
half-finished passkey sign-ins through Redis. Give each one its own
`TEANODE_INSTANCE_ID`: it is part of the key under which usage counters are
accumulated, and two instances sharing a name lose each other's counts.

    docker compose --profile cluster up -d

starts MinIO and Redis alongside. Uncomment the `TEANODE_S3_*` block in `.env`
at the same time; the credentials there are the same ones MinIO is started
with, because the server is the thing connecting.
