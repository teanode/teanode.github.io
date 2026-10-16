Start with the assistant alone, which needs no domain and no mail ports.
Mail at your own domain can be added later without losing anything.

## What you need

- A computer that stays on, with Docker and the compose plugin. The compose
  file starts PostgreSQL for you.
- A model to think with: an API key from OpenAI, Anthropic or Gemini, a
  ChatGPT plan you already pay for, or an Ollama or vLLM of your own.
- For the iPhone app, or to use it away from that computer, an HTTPS address
  in front of it, from any reverse proxy.

## 1. Start the server

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.assistant.yml
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" > .env
    chmod 600 .env
    docker compose -f docker-compose.assistant.yml up -d

It listens on port 8080 of the computer's own loopback address, and on
nothing else.

## 2. Claim the dashboard

Open http://127.0.0.1:8080/. If TeaNode runs on a server rather than the
computer in front of you, reach it through an SSH tunnel first:

    ssh -L 8080:127.0.0.1:8080 you@your-server

The first visitor creates the only account, an administrator, so do this
right away.

## 3. Turn the assistant on

Open **Manage → Server → Setup**. It lists what is left, in order, and says
which steps are done:

1. **Connect a model provider and test it.** On **Manage → Agents →
   Models**, add a provider with your API key, or the address of your own
   Ollama or vLLM, and press **Test**. Then choose the **Default** model and
   save: a small, inexpensive model from your provider is a good start (on
   OpenAI, `gpt-5-mini`); type part of a name to narrow the list. An
   **Embedding** model (on OpenAI, `text-embedding-3-small`) is optional and
   lets memory be searched by meaning.
2. **Enable the assistant.** On **Manage → Agents → General**, turn on
   **Enabled** and save. Each of these saves says it waits for a restart;
   restart once, at the next step.
3. **Restart this instance.** The provider, the models and Enabled are read
   when the server starts. Press **Restart now** on this step, or use
   **Manage → Server → About**.
4. **Turn on your own agent.** Each person turns on their own, under
   **Settings → Your agent**; the setup page has a button for yours.

Then say hello: press **Open your personal assistant** at the end of the
list, or the round chat button in the bottom corner of any page.

## 4. Reach it from your phone

Put port 8080 behind a reverse proxy with an HTTPS address, add the proxy's
address to the trusted proxies in the server's settings, and open the
dashboard there. The iPhone app connects to that address.

## With your own mail

To receive and send mail at your own domain, run the mail compose file
instead, or add mail to this server later under **Manage → Server → Setup**.

### What mail needs

- A domain, and the ability to edit its DNS records.
- A host with a stable public address, reachable from the internet on ports
  25, 80, 443 and 587, and on 993 if you want to read the mail in a mail
  program.
- Docker with the compose plugin, as above.

### Start it with mail

    mkdir -p /opt/teanode && cd /opt/teanode
    curl -LO https://raw.githubusercontent.com/ziyan/teanode/main/deploy/docker-compose.yml
    docker run --rm ghcr.io/ziyan/teanode:latest config env --output - \
      --hostname mail.example.com --domain example.com > .env
    chmod 600 .env
    docker compose up -d

Replace `mail.example.com` with the name of your server and `example.com`
with the domain you want mail for. The host name is what your MX record will
point at, so it has to be a name you can add a DNS record for.

Before starting, open `.env` and set `TEANODE_TLS_ACME_EMAIL` to an address
where the certificate authority can reach you. Everything else has a working
default. The file holds the database password, which is why it is `chmod 600`. The server obtains its certificate over HTTP-01 on the first start,
which needs port 80 reachable from the internet.

The compose file also starts ClamAV, which is optional; remove it from the
file if you do not want it, since it alone wants about 2GB of memory. Spam is
scored by a filter inside the server, so nothing else is needed for that.

### Create the account

Open `https://mail.example.com/`. The first visitor creates the only account,
and that account is an administrator with a mailbox of its own, so do this
right away. If you would rather not race, create the account from the shell
instead:

    docker compose exec teanode teanode user create you

### Publish the DNS records

The dashboard lists every DNS record your domain needs, checks them
periodically, and shows which are still missing. Publish them at your DNS
provider. The MX record is the one that makes mail arrive; the SPF, DKIM and
DMARC records are what make it trusted.

### Point an address at your mailbox

A mailbox receives nothing until an address points at it. On the domain's
**Aliases** tab, add one with the kind **Deliver into a mailbox** and pick
yours: the pattern `^you$` makes `you@example.com` yours. Send a message to
it from another account and watch it arrive in your Inbox, unread.

An address that should go somewhere else forwards instead: a pattern such as
`^hello$` sends `hello@example.com` to an inbox you already read, to a
webhook, or to another mail server, and an empty pattern is a catch-all for
everything nothing else matched. One domain can do both.

### Read it in a mail program

Make an app password on **Mailbox settings → Mail programs**, name it for the
device, and type it into Apple Mail, Thunderbird or your phone along with
your address. The program reads over IMAP on port 993 and sends on 587, and
most of them find both from the address on their own. The password is shown
once.

## Where to go next

- [Deploying](/doc/deploying) covers the container image, upgrades and what
  to back up.
- [Agents](/doc/agents) says what the assistant does and what to weigh before
  turning it on.
- [Getting started](/doc/getting-started) explains the mail DNS records one by
  one, and what to check when mail does not arrive.
- [Configuration](/doc/configuration) documents every setting.
