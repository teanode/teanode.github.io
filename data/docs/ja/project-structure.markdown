各パッケージが何のためにあり、依存がどちらを向いているか。メッセージがシステムをどう通り抜けるかは [`AGENTS.md`](https://github.com/ziyan/teanode/blob/main/AGENTS.md) を参照してください。

## 配置

    cmd/teanode-server/     サーバーのエントリーポイント
    cmd/teanode/            クライアントのエントリーポイント
    internal/               実際のコードすべて。両プログラムのサブコマンドを含む
    web/                    ダッシュボードのソース。internal/frontend/static にビルドされる
    deploy/                 docker compose ファイルとイメージの Dockerfile
    docs/                   docs/decisions/20260818-documentation-layout.md を参照
    vendor/                 コミットされた依存ライブラリ

## パッケージ

**`internal/config`** — 設定そのもの。型付きの構造体、すべての問題を一度にそれぞれのパス付きで報告するバリデーター、そして不変のスナップショットを渡し、変更をひとまとめに適用する `Store` インターフェース。運用者が設定できるものはすべてここにあります。ユーティリティ以外に依存しないので、どのパッケージからでもインポートできます。PostgreSQL に永続化するストアがここにない理由がそれです。

**`internal/db`** — GORM を通した PostgreSQL。モデルごとにインターフェイスがひとつ——ドメインとそのエイリアスと資格情報、ユーザー、ロール、グループ、メールボックスとそのフォルダーと項目、identity、メール、配送、レポート、テンプレート——管理対象への変更はどれも同じトランザクションの中で監査され、そして設定だけを持つ `configuration` テーブル。ドメインのテーブルのシークレットはサーバーシークレットで封じられています。マイグレーションは `internal/db/migrations` に、前向きと逆向きの両方があります。

**`internal/access`** — 誰が何をしてよいか。新しいサーバーが持って始まるロールとグループを用意し、その人のグループから実効的な権限を解決し、すべてのアカウントにメールボックスがある状態を保ち、アプリパスワードでメールプログラムをサインインさせ、ID プロバイダーの subject をアカウントに結び付けて、プロバイダーがクレームするグループと突き合わせ、そして誰もサインインできなくなったときの救出路でもあります。

**`internal/imap`** — `go-imap/v2` を通してメールボックスをメールプログラムへ。フォルダーの UID と modseq はそのフォルダーのもの、フラグは項目のもの、メールは求められたときにストレージから読まれ、待機中のセッションはデータベースの `folder_changed` 通知で起こされます。別のインスタンスが必要とするものはメモリに置きません。

**`internal/sso`** — OpenID Connect プロバイダーによるサインイン。PKCE 付きの認可コードフロー、署名され期限のある state、そしてプライベートアドレスとは話さないクライアント。`internal/api/v1api/apisso` がブラウザーの通る二つの HTTP パスです。

**`internal/bootstrap`** — 環境変数が語ること。データベースへの到達方法、このプロセスがどのインスタンスか、そして空のデータベースに対する初回起動で、どんなサーバーを作るか。意図して小さくしてあります。ここにあるものはプロセスごとで、変えるには再起動が要ります。データベースにあるものは共有され、再起動は要りません。

**`internal/mx`** — メールの経路であり、メッセージに何が起きるかを決める唯一のパッケージ。

    exchange.go             配線と、経路を選ぶ HandleEnvelope
    exchange_incoming.go    受信: 認証、保存、エイリアスの照合
    exchange_outgoing.go    認証済み資格情報からのサブミッション
    exchange_delivery.go    一回の配送試行、再試行、失敗時のバウンス
    exchange_bounce.go      戻ってくる配送状態通知
    exchange_dmarc.go       戻ってくる DMARC 集計レポート
    exchange_usage.go       メモリ上のカウンター。データベースに書き出される
    exchange_utils.go       ヘッダーの整形、並列の認証器

**`internal/spamfilter`** — メールの経路と、メールを採点する何かとの継ぎ目。これを満たすものが二つあります。外部の SpamAssassin デーモンへのアダプターと、下のフィルターです。`Message` はサーバーがすでに確定させたもの——認証の結果、確認済みの逆引き名、解析済みのメール——を運ぶので、フィルターはそれを読むだけで、割り出し直しません。

**`internal/strainer`** — 内蔵の迷惑メールフィルター。注ぐときに葉を止めるもの（茶漉し）から名付けました。SpamAssassin ではありませんし、そう名乗ってもいません。切り替えられる四つの情報源があります。サーバーがすでに持っている信号、普通の DNS で引く公開ブロックリスト、このサーバー自身のメールで訓練した分類器、そして公開されたパターンルール。

    strainer.go             サーバーがすでに知っていることを読む検査
    dns.go                  ブロックリストの照会、そのキャッシュと拒否コード
    bayes.go                分類器と、その訓練
    rules.go                公開されたルール形式の解析と評価
    meta.go                 ルールが互いを組み合わせる式の言語
    ruleload.go             解析済みルールをデータベースと歩調を合わせて保つ

**`internal/api`** — すべての API バージョンが共有するもの。エラー値、リクエストのコンテキスト、パス。意図してほとんど何にも依存せず、バージョン付きのパッケージと `internal/web` のどちらからもインポートできます。

**`internal/api/v1api`** — バージョン 1。`/api/v1` にマウントされます。三つの部分からなります。

    apigraph/   GraphQL エンドポイント。管理 API の全体。
                internal/util/graphapi がリフレクションで Go の型から生成する。
                クエリはデータベースを読み、設定を変えるミューテーションは
                config.Store を通って設定テーブルに落ち、すべてのインスタンスに見える。
    apisend/    POST /api/v1/send/{domain}/{template}。SMTP 資格情報で認証し、
                SMTP を話したくないアプリケーション向け。"variables" と並んで
                "locale" を受け取り、テンプレートが持つ最も近い翻訳を描画する。
    apimail/    保存されたメッセージの生の .eml と添付。ファイルであって
                JSON ではないので GraphQL ではない。

**`internal/client`** — その API の反対側で、コマンドラインクライアントが使います。リソースごとに一ファイルでクエリを書き出し、`introspect.go` がサーバーからスキーマを読んでどの操作に対してもクエリを組み立てます。`teanode api` が手書きのコマンドなしにすべての操作に届くのはこのためです。

**`internal/cmd`** — クライアントのサブコマンド（グループごとに一ファイル）と、両プログラムが共有する補助。サーバーへの到達（`client.go`）、保存されたプロファイル（`profile.go`）、ブラウザーでのサインイン（`loopback.go`）、表とプロンプト。`internal/cmd/server` はサーバー自身のサブコマンドで、`run` と、データベースを直接書く少数の操作です。[`docs/reference/command-line.md`](/doc/command-line) と、なぜ二つのプログラムなのかについては [`docs/decisions/20260903-two-binaries.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260903-two-binaries.md) を参照してください。

**`internal/web`** — HTTP サーバー、ルーティング、ミドルウェア。メールのことは何も知りません。

**`internal/dns`** — 設定された各ドメインの DNS レコードが公開されているかを定期的に確認し、足りないものを報告します。助言にとどまります。[`docs/decisions/20260818-dns-verification-is-advisory.md`](https://github.com/ziyan/teanode/blob/main/docs/decisions/20260818-dns-verification-is-advisory.md) を参照してください。

**`internal/mailer`** — テンプレートを描画し、サーバー自身の名でメールを送ります。ダッシュボードで書いたメッセージ、送信エンドポイント向けに描画したテンプレート。`Render` はロケールで翻訳を選んでテンプレートを埋め、`Send` はテキスト、HTML、添付からメッセージを組み立て、ドメインからの送信メールとして `mx` に渡します。

**`internal/models`** — `db`、`api`、`mx` の間で共有される素の構造体。列挙型の補助以外の振る舞いはありません。

**`internal/util`** — プロトコルの実装。それぞれ独立してテストでき、プロジェクト固有の前提を持ちません。

    smtpd       SMTP サーバー: 会話、STARTTLS、AUTH、制限
    smtpc       配送に使う SMTP クライアント
    mailparse   分割、ヘッダーのデコード、アドレスの署名
    dkim        DomainKeys Identified Mail の署名と検証
    spf         Sender Policy Framework の評価
    dmarc       DMARC ポリシーの参照と集計レポートの解析
    arc         Authenticated Received Chain。転送を生き延びる
    authres     Authentication-Results ヘッダーの整形と解析
    dsn         配送状態通知の解析
    autoacme    ACME クライアント。http-01、tls-alpn-01、dns-01 のソルバー付き
    resolver    キャッシュ付き DNS リゾルバー
    clamav      任意のウイルススキャン
    spamc       任意の SpamAssassin スコアリング
    geoip       任意の送信者の地理情報
    dropper     接続の切断リスト
    graphapi    Go の型からの GraphQL スキーマ生成
    atomicfile  一時ファイルに書いてから改名。すべての機微なファイルに使う
    security    識別子、資格情報のエンコード、署名
    periodic    一定間隔で関数を実行するループ

## 依存の方向

`internal/cmd/server` はすべてに依存します。`api`、`mx`、`dns`、`imap`、`sso`、`mailer` は `config`、`db`、`models`、`util` に依存します。`util` のパッケージは互いと標準ライブラリにしか依存しません。`util` の中のものが `config`、`db`、`models` をインポートしてはいけません。これらは独立したライブラリとして持ち出せるように作られていて、そのいくつかはこのプロジェクトを公開する価値の理由です。
