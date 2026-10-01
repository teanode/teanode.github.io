TeaNode は二つのプログラムです。`teanode-server` はメールサーバーと、そのホストにしかできない少数のこと。`teanode` はクライアントで、API を通じてどこからでもサーバーを管理する、運用者が開いているものです。

クライアントが変えるものはすべて、データベースに直接ではなく、動いているサーバーを通ります。だからシェルからの変更は、ダッシュボードからの同じ変更とまったく同じに振る舞います。同じ検証、同じ副作用です。理由は [`docs/decisions/20260818-the-cli-goes-through-the-api.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260818-the-cli-goes-through-the-api.md) を、なぜ二つのプログラムなのかは [`docs/decisions/20260903-two-binaries.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260903-two-binaries.md) を参照してください。

## teanode-server

| コマンド | すること |
| --- | --- |
| `teanode-server run` | サーバーを動かす |
| `teanode-server config env` | 出発点となる環境ファイルを書く |
| `teanode-server config rules import\|show` | 組み込みの迷惑メールフィルターのパターン規則。一式を取り込むか、保存されているものを見るか |
| `teanode-server user list\|add\|password\|remove\|reset\|rescue` | サーバーを通さずにアカウントを取り戻す |
| `teanode-server config init` | データベースをマイグレーションし、環境変数が記述するものを保存する |
| `teanode-server config show\|validate` | 保存された設定を見る、確かめる |
| `teanode-server config import\|export` | `teanode.yaml` をデータベースに読み込む、または書き出す |
| `teanode-server tls self-signed` | ローカル開発用の証明書 |
| `teanode-server password` | エクスポートした設定のためにパスワードをハッシュする |
| `teanode-server evaluate scenario <file>` | 記憶のシナリオを専用のデータベースで書き留めと夜の整理に通し、チェックポイントごとに問いを採点します。リポジトリの `docs/evaluation/scenarios/` を参照 |

これらはサーバーが読む環境変数（`TEANODE_DATABASE_URL` など）を読むので、サーバーが動く場所で実行します。そのコンテナの中か、env ファイルをシェルに読み込んで。`teanode-server user` は保存された設定を直接編集し、起動しないサーバーや誰もログインできないサーバーのためにあります。日常のアカウント管理は、サーバーを通す `teanode user` で行います。

## teanode

### サインイン

どこからでも、一度サインインします。

    teanode auth login --url https://mail.example.com

これはブラウザーでダッシュボードを開きます。まだならそこでサインインし、「承認」を押すと、トークンは自分のマシン上のループバック接続でコマンドに戻ってきます。クリップボードにもシェルの履歴にも何も通りません。トークンは*プロファイル*として `~/.config/teanode/profiles.json` に、あなただけが読める形で保存され、以後のすべてのコマンドが話す相手になります。

ブラウザーがコマンドに届かないなら（リモートデスクトップ、制限されたブラウザー）、ページは代わりに貼り付けるコマンド全体を表示します。別の方法で発行したトークンは直接貼り付けられます。

    teanode auth login --url https://mail.example.com --token -

複数のサーバーは複数のプロファイルです。`auth list` が一覧し、`auth switch` が有効なものを切り替え、`--profile NAME`（または `TEANODE_PROFILE`）が一回のコマンドのために別のものを選び、`auth logout` がプロファイルのトークンをサーバー上で失効させて忘れます。

    teanode auth login --url https://staging.example.com --name staging
    teanode --profile staging domain list
    teanode auth switch staging
    teanode auth status

プロファイルは*読み取り専用*にできます。このマシンでは、変更はすべて送られる前に拒否され、読み取りは普段どおり通ります。見てよいが触ってはいけないスクリプトやエージェントに渡すのは、このプロファイルです。トークン自体は変わりません。サーバーは変更を受け付けるはずで、このプロファイルがそれを頼まないだけです。

    teanode auth login --url https://mail.example.com --read-only
    teanode auth set-read-only mail.example.com true
    teanode auth set-read-only mail.example.com false

どのコマンドにも付けられる `--read-only`、または環境変数の `TEANODE_READ_ONLY=1` が、プロファイルが何と言っていようと、ひとつのコマンドやひとつのシェルに同じことをします。逆向きのフラグはありません。この変数を渡されたものが、口先で抜け出すことはできません。拒否された変更は終了コード 3 で終わり、三つのスイッチのどれを戻せばよいかを告げます。`auth logout` は今も変わらずプロファイルのトークンを失効させます。プロファイルを忘れてトークンを生かしたままにするほうが、悪い結末だからです。

保存したプロファイルにもう一度サインインすると——`--url` なしの `auth login`（`--profile` が指すもの、なければ有効なもの）や、どれかの `--url` または `--name` を付けたもの——トークンが差し替えられ、古いものはサーバー上で失効させられ、そう告げられます。読み取り専用と証明書の設定は、別に指示しない限り保たれます。読み取り専用のプロファイルでは、古いトークンはそのまま残され、手で失効させるために名前が示されます。

ファイルを持ちたくないスクリプトは `TEANODE_URL` と `TEANODE_TOKEN` を設定します。プロファイルを迂回します。`--url` があってトークンがなければ、そのサーバーの保存済みプロファイルがトークンを貸します。

**サーバー自身の上では**、何も設定する必要はありません。サーバーの環境変数がシェルにあれば（コンテナにはすでにあります）、クライアントは保存された設定からサーバーシークレットを読み、それで署名したトークンを作り、ループバックで接続します。

    docker compose exec teanode teanode user list

    set -a; . /opt/teanode/.env; set +a
    teanode domain list

これが*コンソール*です。アカウントではないので、アカウントに属する操作（トークン、セッション、パスキー）は、受け付ける場所では `--user` が要るか、本当のサインインが要ります。プロファイルもあるシェルからは `--profile local` でコンソールに届きます。

コマンドがどのサーバーと話すかはこの順で決まります。`--url`、次に `--profile`、次に有効なプロファイル、次にコンソール。明示が保存済みに勝ち、保存済みが環境に勝つので、変数を設定したスクリプトが、誰かが最後にログインしたサーバーに驚かされることはありません。

### コマンド

リソースごとにひとつのグループで、API にあるものは `list`、`get`、`create`、`update`、`delete` を持ち、そのリソース固有の動詞が加わります。既定は表で、どのコマンドにもある `--json` が同じものを JSON で出力するので、ひとつのコマンドが人にもスクリプトにも仕えます。

| グループ | 扱うもの |
| --- | --- |
| `auth` | サインインと、保存されたプロファイル |
| `domain` | このサーバーがメールを受け取るドメイン、その DNS レコード、そして公開する `logo` |
| `alias` | ドメインのメールがどこへ行くか。`alias match` はあるアドレスが何に当たるかを言う |
| `credential` | このサーバーを通して送るための SMTP 資格情報 |
| `dkim` | 送信メールに署名する鍵と、公開するレコード |
| `user` | このサーバーのアカウント。`teanode-server` の `user rescue` はひとつを管理者にする |
| `group` | 誰が何をしてよいか、どのドメインの上でか。メンバー、ロール、ドメイン |
| `role` | グループが持つ、名前の付いた権限の集まり。`role permissions` が与えられるものを列挙する |
| `audit` | 管理上の変更の記録。絞り込みつき |
| `mailbox` | メールボックスとその中のすべて。`folder`、`rule`、`subscription`、`device`、`autoreply`、`programs` |
| `token` | API トークン。コンソールでの `token create --user` が誰かの最初のトークンを発行する |
| `session` | ダッシュボードにサインインしているブラウザー |
| `passkey` | あなたのアカウントに登録されたパスキー。登録にはダッシュボードが要る |
| `settings` | 任意の連携。`settings set <section> key=value` |
| `server` | 動いているインスタンス。`status`、`restart`、`addresses`、`identity` |
| `upgrade` | 最新のリリースと、そのインストール。`status [--check]`、`apply` |
| `mail` | 扱ったメール。フィルター付きの `list`、`get`、`content`、`download`、`opens`、`count`、`send` |
| `delivery` | 送る途中で何が起きたか、そしてキューである `delivery pending` |
| `report` | ドメインについて受け取った DMARC 集計レポート |
| `contact` | あなたのアドレス帳。あなたが保つ人々で、電話とコンピューターが CardDAV で同期します。`add --name "Ada Lovelace" --email ada@example.com` がひとり保ち、`edit <id> --name "Ada King"` は与えたものだけを変えてカードの残りはそのままにするので、名前を直しても電話が付けた写真は捨てられません。`--card -` は vCard 全体を標準入力から読みます。`mailbox contact` とは別物で、あちらはメールボックスがやり取りしたアドレスです |
| `calendar` | あなたのカレンダー。電話とコンピューターが CalDAV で同期します |
| `template` | ドメインのメールテンプレート。`render` 付き |
| `layout` | テンプレートを描画するときに包む枠 |
| `api` | それ以外のすべて。スキーマから直接 |

いくつかの例。

    teanode domain create example.com
    teanode alias create example.com --pattern '^hello$' --kind email --email me@example.org
    teanode alias create example.com --pattern '^you$' --kind mailbox --mailbox <メールボックス id>
    teanode alias match example.com hello
    teanode settings set antispam enabled=true host=127.0.0.1 port=783
    teanode server status
    teanode mail list --domain example.com --status rejected --first 20
    teanode mail send example.com --from hello@example.com --to ann@example.org \
        --template welcome --variable name=Ann
    teanode template render example.com welcome --variable name=Ann
    teanode delivery pending

ものは人が呼ぶように名指しします。ドメインはその名前で、テンプレートはドメインと名前で、エイリアスや資格情報は一覧が印字する識別子で。取り消せないことは先に尋ねます。`--force` は質問を飛ばします。

`settings set` は汎用です。キーと型はサーバー自身のスキーマから来て、`settings describe <section>` がそれを一覧します。値の `-` は端末からエコーなしに読む、シークレットのためのものです。

### スクリプトから、エージェントから

同じコマンドがスクリプトにも仕えます。誰も見ていないときに効いてくる違いが三つあります。

質問は、答えられる相手にしかしません。標準入力が端末でないとき、確認を求めるはずのコマンドは、誰も見ないプロンプトを出す代わりに `--force` の案内を添えてその場で断ります。`TEANODE_FORCE=1` は、すでに決めているシェルのために、その種の質問すべてに答えます。

`--json` は成功だけでなく失敗にも効きます。エラーは `{"error": "...", "exitCode": N}` として標準エラーに出るので、呼び出し側は両方を同じように解析できます。`teanode api` は常に JSON を出力し、そのエラーも同じです。

終了コードは、どの種類の問題が起きたかを言います。

| コード | 意味 |
| --- | --- |
| `0` | うまくいった |
| `1` | ほかの何かが起きた。メッセージが何かを言う |
| `2` | コマンドの呼び方が違う。引数が足りない、存在しないフラグ、尋ねる相手のいない確認、選択肢にない値 |
| `3` | 読み取り専用のプロファイル、`--read-only`、`TEANODE_READ_ONLY` に拒否された変更。何も送られていない |
| `4` | サーバーにそんなものはない |
| `5` | サーバーがトークンを拒否した。もう一度サインインする |
| `6` | サーバーにまったく届かなかった |

シェル補完はバイナリ自身から出てきます。

    source <(teanode completion bash)
    source <(teanode completion zsh)

### シェルからメールボックスを使う

`teanode mailbox` は、ダッシュボードのメールボックスからダッシュボードを取り除いたものです。たいていの人はメールボックスをひとつしか持たないので、`--mailbox` が要るのは複数あるときだけで、フォルダーは識別子ではなく名前で指します。

    teanode mailbox folder create GitHub
    teanode mailbox rule add GitHub --when from:contains:@github.com --move GitHub --stop
    teanode mailbox rule apply

条件は `フィールド:演算子:値` で、繰り返せて、すべてが一致しなければなりません。フィールドは `from`、`to`、`subject`、`header`、`score`、`sender-known`、`any`。演算子は `contains`、`equals`、`matches`（正規表現）、`above`、`below`。header の条件はヘッダー名を書きます。`--when header:List-Id:contains:golang`。二つのフィールドは値を求めず、単独で書きます。`--when sender-known` と `--when any` です。アクションはフラグで、`--move`、`--mark-read`、`--flag`、`--forward`、`--delete`、そして `--stop` はこのルールで実行を終えます。

ルールが振り分けるのは、それが書かれた後に届いたメールです。`rule apply` は、保存されたルールをフォルダーにすでにあるものの上に走らせ、到着時と同じように移動、マーク、フラグ、削除を行います。転送は繰り返しません。古いメールをもう一度送ることはしないからです。`rule test` は何が起きるかを告げるだけで、何も変えません。

このグループの残りは、メールボックスの残りです。`mailbox list` は開けるメールボックスを、`--all` はサーバー上のすべてのメールボックスを所有者とともに並べます。`show` と `update` はメールボックスの名前と署名を読み書きします。`folder list|create|rename|move|pin|unpin|delete` は左欄のツリー、`rule list|add|remove|enable|disable|test|apply` は振り分け、`subscription list|show|mail|unsubscribe` は受け取っているメーリングリスト、`contact list|add|remove` は覚えたアドレス、`device list|add|remove` はメールプログラムがサインインに使うアプリパスワード、`autoreply show|set|off` は不在時の自動返信、`programs` はメールプログラムに入力するホストとポートです。

### メーリングリストと、そこから抜けること

サブスクリプションは保存されたひとつのものではなく、保存されたものの集まりです。同じ
リストを名指したメールすべてを、リストが自分のために公開している識別子か、送ってくる
アドレスでまとめたものです。ですから作るものは何もなく、鍵は `subscription list` が
印字するものです。

    teanode mailbox subscription list
    teanode mailbox subscription mail <key>
    teanode mailbox subscription unsubscribe <key>

抜けることは誰か他人への依頼で、三つのやり方のうちコマンドラインで終わるのはひとつだけ
です。ワンクリックの依頼は送られ、メールは送信者が指定したアドレスへ送られ、ページしか
用意していない送信者については、人が開くためにそのページが印字されます。どちらにしても
すでにメールボックスにあるメールは残ります。止まるのは、まだ送られていないほうです。

### ドメインが公開する印

`teanode domain logo show|publish|remove` は、このサーバーが自分のドメインのために
ホストする BIMI のロゴです。

    teanode domain logo publish example.com mark.svg
    teanode domain check example.com          # 公開すべきレコードを印字する
    teanode domain logo remove example.com

ファイルは保存される前に、印が満たさなければならない制限付きのプロファイルに対して検査
されます。スクリプトなし、アニメーションなし、他所から取ってくるものなし、正方形。拒否は
どの規則が拒否したかを名指します。受信側は同じファイルを黙って拒否し、送信者は理由を
知ることがないからです。指し示すロゴができれば `domain check` が公開すべきレコードを
印字し、公開されたレコードを無効にしてしまうものがあればその下に書きます。多くの場合は
DMARC のポリシーが none であることです。

取り除くと、そのファイルの提供が止まります。レコードも下ろしてください。さもないと受信側
は何も答えないアドレスを取りに行き続けます。

### スキーマに載っていないものがふたつ

JSON ではなくバイト列だからです。ひとつめ、下書きのファイルは `multipart/form-data` で、ファイルごとに `file` パートひとつとして `PUT /api/v1/mailbox/drafts/{itemId}/attachments` へ（まだ存在しない下書きなら `POST /api/v1/mailbox/{mailboxId}/drafts/attachments` へ）、同じ bearer トークンを添えて送ります。`curl -F file=@report.pdf` でできます。返ってくるのは保存された下書きで、各パートの番号が入っています。

ふたつめはドメインのロゴです。`POST /api/v1/domains/{domainId}/logo` に `file` パートを
ひとつ添えて送るもので、`domain logo publish` が送っているのがこれです。読むことと取り除く
ことはスキーマの中の普通の操作で、送ることだけがそうではありません。

### API 全体に届く

上のグループはサーバーが今日提供するものを扱います。`teanode api` はすべての操作を扱い、後から加わったものも含みます。手書きの一覧ではなく、サーバーが報告するスキーマで動くからです。

    teanode api list                    # すべての操作
    teanode api list domain             # ドメインに関するもの
    teanode api describe CreateDomain   # 引数、入力の形、戻り値の項目

    teanode api call ListDomains
    teanode api call GetDomain domainId=example.com
    teanode api call CreateDomain domainParameters:='{"domain":"example.com","subdomain":"mail"}'

引数は `name=value` です。数値、真偽値、リスト、オブジェクトには `name:=<json>` を使います。スキーマが数値や真偽値と宣言する型の値は変換されるので、`first=10` は `10` として届きます。

応答は、引数なしで求められるすべての項目を三段の深さまで持ちます。`--depth` がそれを変え、`--select` は生成される選択を丸ごと置き換えます。

    teanode api call ListDomains --select "{ id domain }"

生成されるクエリで表せないものは、クエリを書きます。

    teanode api graphql '{ ListDomains { id domain records { records { type name verified } } } }'
    teanode api graphql --file query.graphql --variables '{"domainId":"example.com"}'

`teanode api` は常に JSON を出力します。

### サーバーが動いていないときに使う

コンソールでは、サーバーが動いていないとき読み取りは保存された設定に戻ります。読み取りは誰の変更も失わず、保存された設定はどのみち最新だからです。初回起動が動くのはこのおかげです。`teanode dkim show example.com` は、サーバーが一度も起動する前に公開すべき DNS レコードを出力します。

書き込みは戻りません。サーバーが止まっているとコマンドは失敗してそう告げます。ダッシュボードから次に保存したときにサーバーが上書きしてしまう変更をするよりは。例外はサーバー自身のプログラムにあります。アカウントの `teanode-server user` と、設定全体の `teanode-server config import` です。

### teanode agent

あなた自身のエージェント、そして運用者にとっては全員のもの。どのコマンドも API を通る
ので、ここでの変更はエージェントのページがしたはずの変更と同じです。

| コマンド | 何をするか |
| --- | --- |
| `teanode agent ask <message \| ->` | エージェントに何か言い、答えを印字します。`--new` は名前のある会話を始め、`--conversation` はひとつを続け、`--attach FILE`（繰り返せます）はファイルを渡します――画像は見せられ、テキストファイルは読まれ、それ以外は名前だけ告げられます。`--json` はすべての出来事を流し、`--quiet` は答えだけを印字します。あなたの承諾が要るツールは端末で y か n を尋ねます。フラグにはしません |
| `teanode agent chat` | 同じことを、空行が来るまで一往復ずつ |
| `teanode agent brief on\|off\|now` | 毎朝の短い便りを、メールで。その日に何があるか、何が返事を待っているか、何が留め置かれているか。`on --at 07:30 --days 1-5` がいつかを言い、`now` はすぐ一通送ります。「Daily brief」という普通のスケジュールを書くので `agent schedule list` に現れ、何を尋ねるかは誰でも書き換えられます |
| `teanode agent conversation list\|show\|new\|rename\|goal\|main\|archive\|unarchive\|delete` | 主な会話と、名前の付いた会話。`list --query` は題名や話された言葉から探し、`list --archived` は開いているものではなく片づけたものを並べます。`show` は目標があればメッセージの上に、task list を下に、済んだものに印を付けて出し、`--first` と `--offset` で長い会話をさかのぼります。`main` は名前の付いた会話を主なものにするか、新しい主な会話を始めて古いほうを名前付きとして残します。`archive <id>` は中身ごと片づけ、`unarchive <id>` は戻します。どちらも何も失わないので先に尋ねません。`delete` は先に尋ね、一緒に来たファイルも持っていきます |
| `teanode agent conversation goal [<conversation-id>] [<goal>]` | その会話でエージェントが目指し続けること。自分の turn をまたいで、達したと言うか、あなたが消すまで続きます。`goal <id> "今週は大家からのメールすべてに返信する。送る前に必ず私に訊くこと"` で設定し、`goal <id> --clear` で取り下げて進行中の turn を止めます。`goal` だけなら、まだ進行中の目標を、その状態（進行中、あるいはあなた待ち）とそれぞれについてのエージェントの最後の言葉とともに並べます。エージェントのページの「目標」タブと同じ一覧です。`goal <id> --met` は済んだと言い、それが実行していたアイデアがあれば、それも仕上げます。`conversation new --goal` は最初から目標を持った会話を始めます |
| `teanode agent idea list\|propose\|start\|done\|dismiss\|reopen` | エージェントがあなたのために申し出ること、そしてそれぞれがどうなったか。「アイデア」タブやエージェントの `idea` ツールと同じ一覧です。`list` は開いているものを、`--status dismissed` や `--all` はそれ以外を出します。`start <id>` はそのアイデアの名前で会話を開き、そこで言うことを印字し、`--send` で実際に言います。`done`、`dismiss`、`reopen` はそれがどうなったかを言います。`propose` はあなたが書いたものを、エージェントのものと同じように確かめて保ちます。エージェントが持つ道具だけを要し、道具が他の人へ働きかけるところでは先に尋ねると言い、何がきっかけかを `--evidence message:<item-id>:<それが何か>` で名指さなければなりません |
| `teanode agent conversation todo list` | 会話が持つ task list。エージェント自身のもので、何段階かに分けて進めるあいだに書き、毎回自分で読み返します。`todo list <conversation-id>` がそれを印字します。変えるのはエージェントだけです |
| `teanode agent run list\|show\|stop` | エージェントが自分でしたこと。モデルの呼び出しはどれも一つの実行で、`list` は `--first` と `--offset` でページを送ります。`--kind triage --kind reply` あるいは `--kind triage,reply` で種類を絞り、`--query` で何についてのものかを絞ります。`agent:act` を持つ運用者は `--all` か `--agent <id>` で全員のものを一覧できます。`stop <run-id>` はその場で止め、すでに済んだことはそのまま残ります |
| `teanode agent tools` | あなたのエージェントが持つツール。あなたが使える形で、リスク区分と、先に尋ねるかどうかとともに |
| `teanode agent memory index\|get\|search\|note\|page\|merge\|link\|unlink\|move\|forget\|history\|recall\|learned` | エージェントがあなたについて知っていること。番号の付いた事実を載せたページとして扱います。`get people/alice-chen`、`note people/alice-chen "帳簿を見ている" --applies-to triage,reply`、`link people/alice-chen projects/greenfinch --relation works_on`、`move notes/marigold things`。`move --number 3 people/alice-chen projects/greenfinch` はページ丸ごとではなく事実をひとつだけ別のページへ移し、どの言葉から来たかを保ちます。`forget people/alice-chen --number 2`。番号のない `forget people/alice-chen` はページとその下のすべてを取り、先に尋ねます（`--force` で省略）。`merge work/old-portal projects/greenfinch` はページをもう一方へ折り込みます。ほかに `history projects/greenfinch`。`search "<words>"` は言葉でページと事実を探し、一度に `--first` 件（既定 40）。もっと見つかったときは、ページと事実があといくつあるか（数えきれなかったところは「少なくとも」）と、次のページを出す `--offset` を言います |
| `teanode agent memory recall "<question>"` | その問いが turn へ何を運び込むか。recall が開くページと、それぞれに載る事実を、ページ自身の番号のまま、`memory get` がページを印字するのと同じ形で出します。実際の turn が行うのと同じ recall なので、「なぜそれを知らなかったのか」に、もう一度訊き直さずに答えられます。しかも元手が要りません。モデルには何ひとつ問わず、使われたという印も付かないので、同じ図は二度とも同じに答えます。`--json` はページと事実をそのままの形で出します。`--search "<words>"`（二つまで）と `--broad` は検索の計画に従います。実際の turn が深さの判断に従うのと同じです。`--explain` は理由も言います。検索のやり方と計画、走った各問い合わせ（メッセージそのもの、計画した各検索、リンクしたページへのひと跳び、広い一巡）、それぞれが見つけた数、そして外されたもの |
| `teanode agent memory overview <path>` | あるページが扱うものがどう働くか。そのページと、その下や隣のページから、直前の夜が書いたもの。それが何か、どんな部分があるか、つながるものとどう関わるか、最近何が起きているか、何が目立つか。`--rewrite` は次の夜に書き直しを頼みます。`memory get` もそれを冒頭の下に、主題なら反省とともに出します。最後に、その概観が何を覆っているかを、サーバーが数えて言います。下のページ、主題のページとそのリンクのうち、プロンプトがいくつを見せたか（全部でいくつか）、そのうち自分の概観を持たないものがいくつか、そして書かれたもとが変わったかどうか |
| `teanode agent survey "<question>"` | 全体についての問いに、概観から答えます。範囲内のページごとに読み取りだけの実行をいくつか同時に走らせ、最後にひとつがそれらを引用つきの報告にまとめます。`--scope themes/<one>` や任意のページで絞れ、何もなければ最上位の主題をすべて扱います。種類は survey、数分かかります。サーバーで調査を始め、数秒ごとに終わったかを尋ねるので、それほど長く開いたままの要求はありません。一時の理由で失敗した読み取り（プロキシの向こうでのサーバーの再起動、切れたネットワーク、時間切れ）は間隔を広げながらやり直し、三十分経つと待つのをやめます。どう終わっても調査の id を名指し、`teanode agent background show <id>` に使えます。`--no-wait` は id を出してすぐ戻り、コマンドを止めても調査は走り続けます。`--json` は仕上がったものを、報告と実行とともに出します |
| `teanode agent background list\|show\|stop` | エージェントが待たずに始めた調査と子エージェント、そして `agent survey` が始めた調査。`list` は待っているもの、走っているもの、最近終わったものを新しい順に言い、`show <id>` はそのひとつの報告か答えを、標準エラーにはその状態と行った実行を出します。`stop <id>` は待っているか走っているものを止め、それはもう何も起こしません |
| `teanode agent memory evaluate <file>` | 一組の問いを recall に通し直し、必要な事実が運ばれたかどうかを問いごとに言います。一問一行――`direct 03 hit`、`changed 12 miss: carried people/alice-chen saying "berlin"`――そのあと種類ごとと全体の合計。ひとつでも外せば終了コードは非ゼロです。モデルには何ひとつ問わず、図の中の何にも使われた印は付かないので、同じ図は二度とも同じに答え、この一組を夜の前と後で走らせれば、その夜の値打ちが分かります。ファイルの形と、自分の図から出た問いに置き換えるための出発点の一組は、リポジトリの `docs/evaluation/` にあります。`--mode planned` は各問いが持つ計画（`memory plan` を参照）に、実際の turn と同じように従います |
| `teanode agent memory answers <file>` | `expectedAnswer` を持つ一組の問いのそれぞれに、記憶から、情報源から、あるいは両方から答え（`--from memory,sources,both`）、期待された答えと照らして採点します。問いと情報源ごとに一行――`memory changed-01 stale gave the old address`――そのあと情報源ごとに点数、判定、費用、一つの答えにかかった時間。問いと情報源ごとにモデルを二回呼び、種類 `evaluate` の実行になります。会話にも図にも何も書きません。`--json` はすべての答えを出します。リポジトリの `docs/evaluation/` を参照。`memory@planned` と `both@planned` は各問いの `plan` に従います |
| `teanode agent memory plan <file>` | 実際の turn が各問いにどの検索計画を使うかを深さの判断に尋ね、`--output <file>` で各問いの `plan` を付けて問いの組を書き戻します。`evaluate --mode planned` と `answers --from memory@planned` のためです。問いごとに速いモデルを一回呼び、種類 `evaluate` の実行になります。`--stored` はファイルの代わりに、記憶の確認で確かめられ直された問いを計画します |
| `teanode agent knowledge list\|add\|set\|pause\|resume\|sync\|remove` | エージェントが読みに行く場所。`add "work" ~/work --computer laptop --under work`。`set work --cron "0 4 * * *" --under projects` はすでにある情報源を変えます――名前、場所、見つけたものをどこへ入れるか、どれくらいの頻度で読むか、形式、メールボックス、その下のチェックアウトを全部読むかどうか――そして渡さなかったものはそのままなので、時刻を直すだけのことに、消して入れ直す代償を払わずに済みます。`--read-every-checkout` はそのパスの下のチェックアウトすべてのファイルを読みます。既定では、あなたの仕事がほとんど入っていないチェックアウトはその概要だけに留められ、ページはそれが何でどこにあるかを言い、ソースは索引に入らず、情報源の行がそれが何件で何ファイルだったかを言います。`--own-commits-at-least` は、ファイルが読まれるまでにそのチェックアウトへのあなた自身のコミットがいくつ要るかを、履歴の長さによらず言います（触らなければ program が決めます。二つ、または log の五十分の一の多いほう、上限は二十五。履歴全体を超えることは決してないので、あなたが一度だけコミットし他の誰も触れていないリポジトリはあなたのものです。`1` は古い規則で、コミットがひとつでもあればよい）。`--commits-per-pass` は、木を一巡するあいだにどれだけの履歴を運ぶかを、その中のチェックアウトで分け合いながら、新しいものから言います（program 自身の歩調は二千です）。`sync` は今もう一度読み、`pause` は見つけたものを残したまま止め、`remove` は見つけたすべてを忘れるので先に尋ねます（`--force` で省略）。`--format` はそこにあるものの読み方を言います。`files`（git を解するファイルの木）、`journal`（日付のついたノート）、`records`（どんなスクリプトでも書ける JSON 行のフォルダー。隣に置いた `refresh` を常駐プログラムが走査のたびに実行します――エージェントに書かせられます） |
| `teanode agent knowledge search "<words>"` | 索引に入っているもの――あなたのコード、チャット、ノート――の中から一節を探します。エージェントに探してもらう必要はありません。エージェントの knowledge ツールが走らせるのと同じ検索なので、見えるものは同じです。記録から拾った識別子（`ComputeShippingQuote`）はそのまま引かれ、それを定義しているファイルと行として印字され、続いて一節が、どの文書から来たかの下にひとつずつ、その文書を読み返すための識別子とともに並びます。`--first` は件数、`--source <id-or-name>` は一つの情報源に絞り、`--json` は各行をそのまま、点数とともに出します。埋め込みモデルのない配備ではそう言います――言葉だけで見つけたものなので、語をひとつも共有しない言い換えは漏れます。`--offset` は順位のうちいくつを飛ばすか。印字したより多く見つけた検索は、一節があといくつあるか（数えきれなかったところは「少なくとも」）と、次のページを出す `--offset` で終わります。ページを続けて読めば、どの一節も一度ずつ、最初と同じ順に出ます |
| `teanode agent knowledge read <document-id>` | 検索が印字した識別子で、その文書のひとつを読みます。引用から拾った `<id>#<passage>` も受け取ります。`--from` は本文のどこから始めるかを文字数で、`--first` はどれだけ印字するか。終わりまで届かなかった読みは、残りがどれだけあるかを言い、続きから読む命令を印字します |
| `teanode agent source-type list\|search\|install\|update\|add-local\|show\|remove` | このサーバーが読める知識の情報源の型。署名された型の登録簿から入れます。`search` は登録簿にあるものを言い、`install rss` は保存する前に署名を確かめ、`update` は新しい版を入れ、`add-local <source.md>` は自分の型を署名なし、手元のものとして足し、`show` はその型が何を走らせ、どんな設定を求めるかを言います。ある型の情報源は `teanode agent knowledge add <name> --type rss --setting url=https://example.com/feed.xml` で足します |
| `teanode agent knowledge secret list\|set` | 情報源の型が求める秘密。あるサービスのトークンなど。あなたのもので、情報源ごとに一組。`secret list <source>` は何を求め、それぞれが入っているかを言い、`secret set <source> <key>` は値を渡さなければ表示せずに読みます |
| `teanode agent dream log\|runs\|now\|bootstrap\|reread` | 夜のこと。読み、書き留め、下読みする実行です。`runs <id>` はその夜が行ったモデル呼び出しを並べ、どれも `agent run show` で開ける実行です。`now` はエージェントの時間帯にかかわらず、次の一分でひとつ始めます。`bootstrap on` は読むものがなくなるまで広い上限で走り続け、最初の取り込みのためのものです。`reread --minutes 60` は、ある夜がその時間内に既読と印を付けたものを戻します |
| `teanode agent schedule list\|add\|set\|enable\|disable\|remove\|run` | 決まった時刻に自分ですること。`add Morning "0 8 * * 1-5" "今日は何が要る？" --deliver mail` は、あなたの時間帯の cron 一行。あるいは一度きりの瞬間 `"@at 2026-09-12 09:00"`、今からの隔たり `"@in 20m"`。後者はそれが指す瞬間として保存され、一度だけ走ります。`set <id> --cron "0 7 * * 1-5"` はその場で変えます――`--name`、`--cron`、`--prompt`（`-` は標準入力から読む）、`--deliver`。渡したものだけが変わります。`disable <id>` は取り除かずに走るのを止め、`enable <id>` でまた走ります |
| `teanode agent feedback` | あなたのしたことから記録された訂正。エージェントは例として見せられます |
| `teanode agent channel list\|set\|unlink\|remove` | エージェントと話すチャットアプリ。あなた自身の Telegram か Discord のボットです。`set telegram --token -` はボットのトークンを標準入力から読みます。`list` は、あるチャットが `/link CODE` としてボットに送ることで結び付くコードと、ボットが動いているかどうかを示します。`unlink` は新しいコードを引きます |
| `teanode contact list\|show\|add\|edit\|remove` | あなたの住所録。あなたが保つ人たちで、電話とコンピューターが CardDAV で同期します。`add --name "Ada Lovelace" --email ada@example.com` でひとり保ち、`edit <id> --name "Ada King"` は渡したものだけを変えてカードの残りはそのままにするので、名前を直しても電話が置いた写真は捨てられません。`--card -` は標準入力から vCard をまるごと読みます |
| `teanode agent skill list\|search\|install\|update\|remove\|enable\|disable\|scope\|secret` | スキルレジストリからインストールしたツール。このサーバーの全員のためのものです。`search` は何があるかを言い、`install weather` は何かを保つ前に署名とハッシュを確かめ、`update` は名前なしなら新しいものをすべて入れます。`scope <name> operator\|person\|skill` は、そのスキルの秘密をここで誰が埋めるかを決めます――サーバー全体でひと組の値か、各人のものか、スキルが宣言したとおりか。インストールと scope には `server:manage` が要ります。コマンドを走らせるスキルは、あなたが接続したコンピューターで走らせ、先に尋ね、誰も見ていない実行からは決して使われません。`secret list\|set\|clear` は、スキルがサーバーではなく *あなた* に求める値のためのものです。`secret set news NEWSAPI_KEY` は端末からエコーなしで読み、端末がなければ標準入力から読みます |
| `teanode agent mcp list\|connect\|disconnect\|serve` | 運用者が宣言した接続先のサーバーと、あなたのそこへの接続。`connect tracker --credential -` はあなたの資格情報を標準入力から読み、認可するサーバーは開くべきアドレスを印字します。`--loopback` は認可をこの端末に返します。ループバックアドレスにしか答えないサービスのためです; `serve` はこの端末でこの取り決めに応えます。このマシンの上のプログラムが、どこにもトークンを貼らずにエージェントの道具を使えます。`claude mcp add teanode -- teanode agent mcp serve` |
| `teanode app list\|rename\|disconnect` | ブラウザーで承認され、あなたとしてエージェントの道具を使えるプログラム。`rename <client-id> <name>` の名前は更新のあとも残り、`disconnect <client-id>` はそれが持つトークンをすべて取り消すので、もう一度承認が要ります |
| `teanode agent settings show\|set` | あなたのエージェント。`set enabled=true name=Bertie instructions=-` は長い値を標準入力から読みます。キーは `set --help` が並べます。`set alerts=false` でメールについて頼まれずに知らせるのをやめ、`alert-quiet-start=22:00 alert-quiet-end=07:00` は待てないことだけを言う夜、`alert-daily-most=5` は一日の上限です |
| `teanode agent alert list\|mute\|mutes\|unmute` | エージェントが頼まれずに知らせたこと、そしてあなたがやめてと頼んだこと。エージェントのページの「お知らせ」カードと同じ一覧です。`list` は各お知らせを、それが扱ったメールとともに出し、`mute <alert-id>` はそれが覆ったもの（その一続き、あるいは一通の差出人）についてのお知らせを止めます。`--scope subjectKey`、`sender`、`domain`、`kind` で、その件名、差出人、そのドメイン、種類（一続き、あるいは `notification` のような分類）にします。`mute --target offers@shop.example.com` は自分で一つ名指し、`--scope` がなければ範囲はそこから読みます。`mutes` はそれらを並べ、`unmute <mute-id>` で一つ取り消します |
| `teanode agent settings categories add\|remove` | 決まったものの隣に置く、あなた自身の分類 |
| `teanode agent settings forget` | エージェントと、それが学んだすべてを削除します。先に尋ねます |
| `teanode agent source list\|grant\|revoke\|set\|allow\|deny` | エージェントが何に届いてよいか、そしてそれぞれで何をするか。メールボックスには `set --mailbox work triage=true auto-reply=true auto-reply.scope=known`。他の二種類のソースには `allow calendar` と `deny addressbook`。こちらはスイッチだけで方針はありません。渡していないソースからは、何ひとつモデルへ送られません。メールボックスに `alerts=false` を付ければ、そこに届くものについて頼まれずに何かを聞くことはなくなります |
| `teanode agent usage [--since] [--by day\|kind\|mailbox\|model]` | あなたのトークン |
| `teanode agent draft <item-id> [--say "…"]` | メールへの返信をエージェントに書かせ、あなたが使えるように印字します。何も保存されず、送られません |
| `teanode agent replies [--status held\|sent\|cancelled\|refused\|failed] [--mailbox]` | エージェントがあなたのために書いた返信と、それぞれがどうなったか。メールをそのままにした場合はその理由も |
| `teanode agent replies cancel <reply-id>` | 留め置かれた返信を取り消します。下書きは消え、何も送られません |
| `teanode agent admin usage\|list\|limit\|disable\|enable\|dead-letters\|retry` | 全員のエージェント。`agent:audit` が要ります。日、種類、メールボックス、モデル、エージェントごとのトークン。各人のソースと今日の支出。一人だけの上限を、トークンで、あるいは `--cost` で金額で。停止のスイッチ。ワーカーが諦めた仕事 |


どのコマンドもシェルの時間帯と言語をリクエストとともに送ります。ダッシュボードがブラウザー
のものを送るのと同じで、端末に住む人も、ブラウザーに住む人と同じように位置づけられます。

### teanode finance

つないだ金融機関、その口座と取引、純資産、支出カテゴリ、予算、貯蓄の目標。ダッシュボードの
「金融」ページ（とエージェントのページの「金融」タブにある設定）、エージェントの `finance`
道具と同じ操作で、名前もそれに合わせています（道具の `spending_summary` は
`teanode finance spending-summary`）。金額は通貨付きで表示し、`--json` は精度をそのまま保ちます。
仕組みは [`docs/subsystems/finance.md`](https://github.com/ziyan/teanode/blob/main/docs/subsystems/finance.md)
にあります。

| コマンド | 何をするか |
| --- | --- |
| `teanode finance providers` | このサーバーが差し出すプロバイダーと、それぞれのつなぎ方 |
| `teanode finance link-plaid` | Plaid の窓を開くページの住所をブラウザー用に表示し、新しい金融ソースが現れるまで待ちます。`--no-wait` はすぐ戻ります |
| `teanode finance link-simplefin [<setup-token> \| -]` | SimpleFIN Bridge でセットアップトークンを引き換えます。`-` か引数なしなら、表示せずに読みます。トークンは一度しか引き換えられません |
| `teanode finance import-credential --provider plaid\|simplefin [--institution-name NAME] [- \| <file>]` | よそで作った接続を、つなぎ直さずに金融ソースとして取り込みます。このサーバーの Plaid のキーで作った接続の Plaid アクセストークン（Plaid の枠を一つ節約します）か、引き換え済みの SimpleFIN のアクセス URL。資格情報はファイル、標準入力、表示しないプロンプトから読み、コマンドラインからは決して読みません。何かを作る前にプロバイダーに尋ね、最初の同期は一分以内に始まります |
| `teanode finance repair <source-id>` | 金融機関が求めたとき、同じ金融ソースにサインインし直すための Plaid のページをもう一度。再び同期するまで待ちます |
| `teanode finance sources\|sync\|disable-source\|enable-source\|delete-source` | あなたの金融ソース。一つを今すぐ同期、止める、戻す、あるいは持ち込んだものごと消す（先に尋ねます）。どれも金融ソースでないものは断ります |
| `teanode finance accounts\|transactions\|spending-summary` | 金融の口座と残高。取引は `--from`、`--to`、`--since 30d`、`--month 2026-09`、`--text`、`--finance-account`、`--is-uncategorized`、次のページには `--after`。支出と収入を `--group-by spendingCategory\|merchant\|month\|financeAccount\|providerCategory` でまとめます |
| `teanode finance trades` | 投資口座での買い、売り、出し入れした銘柄を新しい順に、銘柄、数量、単価、金額、手数料とともに。`--from`、`--to`、`--since`、`--month`、`--finance-account`、`--finance-security`、次のページには `--after`。売買は支出になりません。配当、利息、手数料は取引です |
| `teanode finance exchange-rate\|convert-currency\|reporting-currency\|set-reporting-currency` | ある日の二つの通貨のあいだの ECB の相場（週末ならその前の直近の日で、どの日かを言います）、金額の換算、合計を表す集計通貨。`set-reporting-currency --clear` で既定に戻ります |
| `teanode finance net-worth\|assets\|asset-history\|create-asset\|update-asset\|close-asset\|delete-asset\|record-valuation\|delete-valuation` | 日ごとの純資産。持っているもの、負っているもののすべてと最新の価値、保有なら銘柄、数量、単価、取得原価（`asset-history` では日ごとにも）。`create-asset "Car" --kind vehicle --currency USD --value 18000` は最初の価値を付けて一つ加え、`record-valuation <asset-id> 16500 --on 2026-09-30` はいくらかを記録します。`--is-estimate-allowed` はエージェントがウェブから見積もるのを許すもので、許せるのはあなただけです |
| `teanode finance spending-categories\|create-spending-category\|update-spending-category\|delete-spending-category` | お金が何に使われるかの、あなた自身の一覧 |
| `teanode finance spending-rules\|create-spending-rule\|update-spending-rule\|delete-spending-rule` | 店名や説明にある言葉を含む取引を振り分ける支出ルール。新しい規則は、あなたが自分で選んだもの以外の以前の取引にも効きます |
| `teanode finance categorize-transaction\|mark-transfer` | 一つの取引の支出カテゴリを変える（`--create-spending-rule` でその店をこれからもそう分類）か、自分の口座どうしで動いたお金を振替と印を付けます |
| `teanode finance budgets\|set-budget\|budget-status\|spending-by-day\|cash-flow` | 支出カテゴリごとの月の予算と、収入カテゴリでは毎月見込む収入（`budgets` がどちらかを言います）。`budget-status` は今月を各予算と比べ、月の行き先とペース（下回る、順調、危うい、超過）、続いて各収入カテゴリを今日までの見込みと比べます（遅れ、順調、先行）。日ごとの支出を先月と比べ、月ごとの収入と支出 |
| `teanode finance saving-summary` | 集計通貨での今月の貯蓄。収入予算から支出予算を引いたものを、ここまでの収入から支出を引いたもの、月の行き先と比べ、差とペース（遅れ、順調、先行）を添えます。`--month` で別の月、`--currency` で別の通貨に換算 |
| `teanode finance savings-targets\|create-savings-target\|update-savings-target\|close-savings-target` | ある日までに貯める額と、これから毎月いくら要るか。`--measure cash_flow`（使わなかったお金、既定）、`net_worth`（`--started-on` から増えた純資産。`--starting-amount` がなければ起点は記録されます）、`asset_value`（`--finance-account` と `--asset` の価値。口座まるごとなら現金とすべての保有、あとで買ったものも数えます）で測ります |

### teanode computer

あなた自身のコンピューターを、あなたのエージェントに接続します。このプログラムが走って
いるあいだ、エージェントにはツールが二つ増えます。`shell` はここでコマンドを走らせ、
`filesystem` はあなたのファイルを読み、編集し、書き、複製し、並べ、検索し、grep します。
あなたとして、このマシンのどこででも、あなたの端末がするのと同じように。使えるのはあなたが
居合わせている会話だけです。定時の実行、仕分けの実行、誰も見ていないものは、決してあなたの
コンピューターを見ません。マシンを変えるコマンド、あるいはマシンの外へ届くコマンド（削除、
移動、インストール、sudo、push、ssh、そしてより重い形のもの）は先にあなたに尋ねます。
引き出しのカードの上か、端末の上で。移動または削除されるファイル、そしてマシンが自分で
走らせるもの（シェルの起動ファイル、鍵、自動起動）への書き込みも同じです。あなたに代わって
拒まれるものは何もありません。最後の言葉はあなたの「はい」です。カードはサーバーのもの
です。プログラムはサーバーが送るものを走らせるので、端末が前に座る人を信頼するのと同じ
ようにサーバーを信頼します。プログラムはあなたとしてサインインし、使うのは有効なプロ
ファイルのトークンで、サーバーとしてではありません。コンピューターは同時に何台も接続でき、
名前で見分けられます。コマンドは `/bin/sh -c`（Windows では `cmd /C`）の下で走り、ログイン
シェルではないので、あなたのエイリアスは効きません。プログラムは四つの要求に同時に答え、
五つめは待たせずに断ります。

| コマンド | 何をするか |
| --- | --- |
| `teanode computer start [--name NAME]` | プログラムをバックグラウンドで走らせます。`--name` はこのコンピューターの呼び名（既定はホスト名）。ログは `~/.config/teanode/computer.log` |
| `teanode computer status` | プログラムがここで走っているか、そしてサーバーがあなたのどのコンピューターを見ているか |
| `teanode computer stop` | プログラムを終えます |
| `teanode computer daemon [--name NAME]` | 同じプログラムを前面で。接続が切れれば繋ぎ直し、中断されるまで走ります。端末のため、あるいはサービスマネージャーのため |
| `teanode computer background list [--conversation ID]` | エージェントの shell があなたのコンピューターで裏に走らせたままのコマンドと、最近終わったもの。新しい順に一行ずつ、id、コンピューター、状態（`running`、`exit N`、`stopped`、あるいは裏のコマンドに許された時間を走りきった `stopped after 24 hours`）、あなたの時刻での開始、そしてコマンド。`--conversation` はひとつの会話が始めたものだけにします |
| `teanode computer background read <computer> <id> [--tail BYTES]` | そのひとつが最後に書いたもの。標準出力への出力、次に標準エラーへのエラー、どちらかが切られたかを言う一行、そして状態を言う最後の一行。`--tail` はそれぞれの流れの終わりからどれだけ出すか。既定は 64 KiB、最大 256 KiB |
| `teanode computer background stop <computer> <id>` | そのひとつを終わらせます。始めたエージェントは、頼んでいない終わりを知らされるのと同じように、それが終わったことを知らされます |

運用者は `agent.features.computer` で、サーバー全体についてコンピューターを止められます。

### teanode calendar

| コマンド | 何をするか |
| --- | --- |
| `teanode calendar list\|show\|add\|edit\|remove` | あなたのカレンダー。電話とコンピューターが CalDAV で同期します。`list --from 2026-09-14 --until 2026-09-21` は何かが起きるたびに一行を印字し、繰り返す予定は出現ごとに一行になります。`add --title Standup --starts 2026-09-14T09:30 --repeat FREQ=WEEKLY;BYDAY=MO` が何かを入れ、`--invite ada@example.com` は招待をメールで送り、予定を動かしたり消したりすれば招いた全員に伝わります。`--all-day` は時刻ではなくその日に属し、その `--ends` はそれがある最後の日なので、両端が同じ日付なら一日です。`--file -` は iCalendar ファイル全体を標準入力から読みます。時刻はオフセットを伴わない限り、カレンダー自身の時間帯で読み書きされます |
| `teanode calendar free` | あなたが空いているとき。働く一日のうち何も入っていない区間を、日ごとに。`--earliest 08:00 --latest 18:00` が一日の両端を動かします。終日の項目はその日を埋めず、取り消されたものも埋めません。電話の free-busy 要求に答えるのと同じ二つの関数で求めるので、ここに印字されるものと同僚のクライアントが告げられるものが食い違うことはありません |
| `teanode calendar calendars\|set` | カレンダーそのもの。何と呼ばれるか、クライアントが何色で塗るか、新しい予定がどの時間帯で書かれるか、そして週がどの曜日から描かれるか。`set --timezone Europe/Berlin`、`set --week-start monday`。カレンダーが別を言わない限り週は日曜から始まり、五日間のビューはどちらにせよ月曜から金曜です。働く一週間とはそういうものだからです |
| `teanode reminder list\|add\|edit\|done\|reopen\|remove` | あなたのリマインダーの一覧。カレンダーの隣にあり、電話の「リマインダー」が CalDAV で同期するものです。`add "切手を買う" --due 2026-09-29` はその日に、`--due 2026-09-29T15:00` はカレンダーの時間帯でその時刻に期限が来ます。`list --done` は済んだもの、`list --all` は両方を出し、`done` は済ませ、`reopen` は戻します |
| `teanode note list\|show\|add\|edit\|remove` | あなたのメモ。電話の「メモ」がメールアカウントに保ち、IMAP で同期するものです。`add "荷造りリスト"` は最初の行を題にして一つ書き、`--file -` は本文を標準入力から読み、`edit <id>` は本文を置き換えます。電話には次の同期で変更が見えます。メールボックスが複数あるときは `--mailbox` で選びます |
| `teanode calendar request <request-id>` | カレンダーの保存が済んだかを、その予定やカレンダーが消されたあとでも確かめます。`add`、`edit`、`remove` は予定を変える前に要求 ID を印字します。応答が不確かなら、ここで調べるか、同じ操作と項目で `--request-id` を付けてやり直します。消去のやり直しは、消された予定を読む前に完了を確かめます。受領が見つからないのは、元の要求がまだ進んでいるということかもしれません。項目を変えたら新しい ID が要ります |
| `teanode calendar stop <request-id>` | 不確かな要求を、その項目を捨てる前に決着させます。まだ確定していない要求は確実に止められ、すでに済んだ変更は報告され、取り消されはしません。止める応答が失敗したら、それもまだ不確かなので、同じ要求 ID でやり直してください |
