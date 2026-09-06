# teanode.com

The front page and the documentation for [TeaNode](https://github.com/ziyan/teanode),
served by GitHub Pages from this repository and reached through
teanode.com.

Everything that is not served lives under `_app/` and `_bin/`, which Jekyll
omits. `_app/CLAUDE.md` explains the layout, the build, and how the
documents are kept in step with the server repository.

    cd _app
    npm ci
    npm run build
