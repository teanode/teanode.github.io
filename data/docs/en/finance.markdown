You link the institutions you hold money with (a bank, a card issuer, a
brokerage, a lender), and the server keeps your accounts, transactions and
balances in its own database. On top of those it keeps your net worth over
time, your own spending categories, budgets and savings targets. Your agent
reads and changes all of it, so you can ask it how the month is going in the
same conversation where you ask about your mail.

## Linking an institution

Two providers sign in to institutions for the server. The operator decides
which ones are offered (`agent.finance.offeredProviders` in the
[configuration](/doc/configuration)).

**SimpleFIN** needs nothing from the operator. You pay for the SimpleFIN
Bridge yourself, make a setup token there, and paste it on the agent page's
Finance tab or into `teanode finance link-simplefin`. The server claims it
once and keeps what it gets back. The bridge holds about ninety days of
history, so that is how far back a new link reaches.

**Plaid** needs the operator's developer account (`agent.finance.plaid`),
because Plaid deals with operators, not with each person. You link through
Plaid's own window, which opens on one dashboard page; that page is the only
one allowed to load Plaid's script. When the bank wants you to sign in again,
the finance source stops and asks you to, and signing in repairs the same link
instead of making a new one. If the operator turns on `investments`, a
brokerage linked through Plaid brings in its holdings and trades as well.

Already have a connection made elsewhere? You can bring it in instead of
linking again: a Plaid credential made with this server's Plaid keys, or a
SimpleFIN access address you already claimed. The provider is asked first,
and nothing is made unless it answers.

A new link syncs within a minute, then every six hours.

## What you get

**Transactions, filed by you.** Every transaction goes under one of your own
spending categories. It is filed by the first of these that has an answer:
you, a spending rule you made ("anything from Corner Grocer is groceries"),
the provider's own category, and last a model. The model is sent the
merchant, the description, the amount and the provider's category, never an
account number. Money moving between your own accounts, and paying off a card,
is marked as a transfer and counts as neither spending nor income.

**Budgets that say where the month is heading.** A budget is a monthly amount
for a spending category. Each one shows what has gone so far and where the
month is heading: the spending so far, the charges that come every month and
have not come yet, and the rest at this month's pace. It is under, on track,
at risk or over. An income category can have a budget too, the income you
expect each month, and it reads behind, on track or ahead.

**Saving.** For any month: what you expected to save (income budgets less
spending budgets), what you have saved so far, and where the month is heading.

**Savings targets.** An amount to save by a day, with what it needs each month
from now on. A target can count money not spent, net worth gained since it
started, or what chosen accounts and assets are worth (a whole brokerage
account counts every holding, including ones bought later).

**Net worth.** Every account becomes an asset with a value each day. You add
the rest yourself: a house, a car, a loan. A car or a house can be estimated
by your agent from the web once a month, with the range and the pages it
used, but only for an asset where you allowed it. Accounts the providers
cannot reach can be read by your agent from a connected server on a daily
schedule.

**More than one currency.** Every amount keeps its currency, and totals are
converted at the European Central Bank's rate for each amount's own day into
a reporting currency you choose. A currency the bank does not publish is
left out of the total, and the total says so.

**Alerts.** At 80 percent of a budget, at risk, over, or a savings target
falling behind, your agent tells you once a month, through the same alerts as
mail (quiet hours and the daily limit included). A spending category can be
muted on its own.

## Three ways in

The same operations, under the same names, in three places:

- **The dashboard.** The Finance page, `/finance`, has Spending,
  Transactions, Accounts, Budgets, Net worth and Savings targets. The agent
  page's Finance tab is the setup: linking, repairing, syncing and the
  reporting currency.
- **The command line.** `teanode finance`, listed in the
  [command line](/doc/command-line#teanode-finance) reference.
- **Your agent.** Its `finance` tool. Ask "how much did we spend eating out in
  September?" or "are we on track for the emergency fund?"

## Privacy

The rows are in your own PostgreSQL, next to your mail; nothing is sent to a
finance service of ours, because there isn't one. The credentials a link keeps
are sealed with the server's secret before they are stored. A SimpleFIN setup
token or a credential you bring in is refused in conversation, because it would
stay in the transcript and go to the model's provider; the agent tells you
where to paste it instead.

What your agent reads about your money does go to the model you chose, the same
as your mail. If that matters to you, the [agent](/doc/agents) can run on a
model on your own hardware.

## Next

- [Agents](/doc/agents) is the agent this sits behind, and what else it can
  reach.
- [Configuration](/doc/configuration#agentfinance) has the operator's keys.
- [`docs/subsystems/finance.md`](https://github.com/ziyan/teanode/blob/main/docs/subsystems/finance.md)
  says how it works in detail.
