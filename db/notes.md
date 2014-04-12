Notes on `db/`
=============

* We cannot define methods on the top-level due to the
[Seedbank's bug][seedbank-bug]. Examples of files that use shitty code due to
this: `seeds/development/thumbnails.seeds.rb`

[seedbank-bug]: https://github.com/james2m/seedbank/issues/19
