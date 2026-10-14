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

## Accounts no provider reaches

Some cards and banks are reached by neither provider, or only let their
holder export a file. Those come in as imported statements, which need
nothing from the operator.

**A statement file.** Export an OFX file (`.ofx`, `.qfx` or `.qbo`) and upload
it under Accounts on the Finance page, run `teanode finance import-statement`,
or mail it to your own statement import address, which the same page shows.
A phone's banking app can usually share the export straight into a mail.
Transactions already imported are updated rather than added again, so
overlapping files count nothing twice, and your agent tells you in the main
conversation which account the statement went into and how many
transactions it brought.

**Screenshots.** An app that shows the transactions but exports nothing can
be photographed. Send the screenshots to your agent in the drawer; it reads
each row, and the import checks them before anything is written: running
balances must chain from row to row and each month must come to its printed
total, or nothing is imported and the row that does not add up is named.
Only the rows the account does not hold already are added, and the account
is found by the last digits it shows, so a later file or later screenshots
land in the same account.

Accounts imported either way can be renamed, given the last digits of their
number when the statement shows none, or deleted with their transactions.

## What you get

**Transactions, filed by you.** Every transaction goes under one of your own
spending categories. It is filed by the first of these that has an answer:
you, a spending rule you made ("anything from Corner Grocer is groceries"),
the provider's own category, and last a model. The model is sent the
merchant, the description, the amount and the provider's category, never an
account number. Two categories are built in: Transfer, for money moving
between your own accounts and paying off a card, which counts as neither
spending nor income, and Other, for what fits none of yours. A transaction
with no category is one still to be decided, and the Transactions list can
show just those.

**Many at once.** Choose transactions with the box at the start of each row
(shift chooses a run, Select all every one the filters match, on every
page) and give them a category together. Tick the box beside it and the
same choice is saved as spending rules: one per merchant, each listed with
how many transactions it matches and how many others it would change before
anything is saved.

**What a transaction was for.** Write a note on any transaction ("party
supplies"), or let your agent write one. It changes yours only when you ask
it to in a conversation.

**Receipts.** A receipt is stored line by line as printed, checked against
its printed totals, and matched to the charge it explains. Photograph one
into the chat, upload a photo or a screenshot on the transaction itself, or
let the agent read one that arrived as mail. A receipt is matched without
asking only to the one charge of exactly its amount that shares a word of
the merchant; anything less certain is offered to you. One recorded before
its charge arrives waits, and is matched when the charge comes in. The
photo sits above the lines, and you can zoom into it. The Receipts tab lists
them all, searchable by what was bought, so "when did I last buy coffee
beans" has an answer.

**Duplicates.** Some brokerages report one account-level fee on every account
of a connection. Those mirrored copies are found, marked and left out of
every total, and you can say a copy is a real charge of its own.

**Ask about one.** A transaction's details end with Ask the agent, which opens
the drawer with that transaction attached to your question.

**Budgets that say where the month is heading.** A budget is a monthly amount
for a spending category. Each one shows what has gone so far and where the
month is heading: the spending so far, the charges that come every month and
have not come yet, and the rest at this month's pace. It is under, on track,
at risk or over. An income category can have a budget too, the income you
expect each month, and it reads behind, on track or ahead. A budget's row
opens its transactions for the month. Spending has a year view too: the
year's totals, a chart of its months, and budgets and saving for the year
from each month's own figures, with where the year is heading.

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

## Taxes

Paystubs, W-2s, 1099s and 1098s are read out of the file you hand in, a PDF
or a photo, and kept to get ready for a tax return. Hand them in on the
Finance page's Taxes tab, share them from your phone, run
`teanode finance read-tax-document`, or mail them to your own tax document
address, which the Taxes tab shows; a payroll mail forwarded there works the
same. Your agent tells you in the main conversation what arrived.

**What is kept.** A paystub is stored line by line as printed: each
earning, each tax and each deduction, with the employer's part beside
yours. A W-2 keeps its boxes. A 1099-INT, 1099-DIV or 1099-B (often all
three in one brokerage statement) keeps its totals, and a 1098 its mortgage
interest. Before a model reads anything, every number shaped like a
taxpayer number is masked to its last four digits, only those four are
stored, and the file is kept without its text.

**What is checked.** A paystub has to add up: gross pay less the taxes and
your deductions is take-home pay. A W-2's Social Security and Medicare are
checked against its wages, and set beside the year's last paystub. A
paystub that does not follow on from the one before, a gap of more than a
pay period and a half, a W-2 not in once the year is over, and Social
Security withheld past the year's maximum across employers (which comes
back on the return) are all pointed out.

**The year.** The tax year puts it together per person and employer: the
W-2 where there is one, else the latest paystub's year to date, carried to
December 31 at your pay cadence, with retirement contributions stopping at
the year's limit. Before the 1099s come, interest and dividends are
previewed from your linked accounts, leaving out IRAs, HSAs and the other
accounts whose income is not taxed.

**The estimate.** The tax owed is set beside what was withheld: federal
income tax by the year's brackets, itemizing when mortgage interest, state
and local taxes up to the cap and gifts beat the standard deduction,
qualified dividends and long-term gains at their own rates, the child tax
credit and the child and dependent care credit, and Social Security and
Medicare. What no document says (children, dependent care paid, a
spouse's pay that has no W-2 here, gifts, property tax) goes in the year's
settings. The filing status is yours to set; without it, two people on the
documents means married filing jointly. It is a start for a return, not
the return: state tax is taken as withheld, and credits other than those
are not counted.

## Three ways in

The same operations, under the same names, in three places:

- **The dashboard.** The Finance page, `/finance`, has Spending,
  Transactions, Receipts, Accounts, Budgets, Net worth, Savings targets and
  Taxes. The agent
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
