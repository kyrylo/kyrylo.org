---
layout: post
title: "A mere add_foreign_key can wipe out your whole Rails+SQLite production table"
date: 2025-09-27
categories: software
image: assets/images/kyrylo-silin@2x.webp
---

A single `add_foreign_key` in a Rails migration can obliterate a dependent table
in your SQLite database. This is exactly what happened with my self-hosted error
tracker, [Telebugs](https://telebugs.com).

I added a new foreign key to the error `groups` table like I normally would,
then deployed my test instance and saw that all individual reports (those that
belong to error groups) were gone. Completely. My face was like WTF (if that
could be a face).

The migration was part of a larger set, but I narrowed it down to this:

```ruby
class AddOwnerToGroups < ActiveRecord::Migration[8.0]
  def change
    add_foreign_key :groups, :users, column: :owner_id, on_delete: :nullify
  end
end
```

So what's going on? It’s all about how Rails and SQLite handle schema changes. My schema had a foreign key from `reports` to `groups` with `on_delete: :cascade`:

```ruby
add_foreign_key "reports", "groups", on_delete: :cascade
```

When I added the new foreign key to `groups`, SQLite (via Rails) needed to
recreate the `groups` table because SQLite doesn’t support `ALTER TABLE` for
adding foreign keys. The process goes like this:

1. Create a temporary table (`agroups`) with the new schema, including the
   foreign key.
2. Copy data from `groups` to `agroups`.
3. Drop the original `groups` table.
4. Recreate `groups` with the new schema.
5. Copy data back from `agroups` to `groups`.

Do you see the problem? When the original `groups` table is dropped, the `reports`
table’s `on_delete: :cascade` foreign key kicks in. Since `reports.group_id`
temporarily points to non-existent `groups.id` values, SQLite deletes all reports
records 💀

## How I fixed it

I rewrote the migration to avoid `add_foreign_key`:

```ruby
class AddOwnerToGroups < ActiveRecord::Migration[8.0]
  def change
    add_column :groups, :owner_id, :integer
    add_index :groups, :owner_id
  end
end
```

This adds the `owner_id` column and index without touching the table structure,
so no data is lost. To enforce the foreign key constraint, I added a validation
in my `Group` model:

```ruby
class Group < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true
  validates :owner_id, inclusion: { in: ->(record) { User.pluck(:id) + [nil] } }, allow_nil: true
end
```

This ensures `owner_id` is either `nil` or a valid `User.id`, mimicking the
database foreign key without SQLite’s pitfalls.

## Lessons learned

- **SQLite gotchas:** SQLite’s table recreation for schema changes can wreak
  havoc with cascading foreign keys. Be cautious with `on_delete: :cascade` in
  migrations.
- **Safer migrations:** Use `add_column` and `add_index` for simple column
  additions, and enforce constraints at the application level when using SQLite.
- **Avoid cascading deletes:** Consider using `on_delete: :nullify` for foreign
  keys like `reports` to `groups` to prevent data loss, though you’ll need to
  handle orphaned `reports` (with `group_id: nil`) in your application logic.
- **Test with data:** Always test migrations with realistic data, including
  invalid foreign key values, to catch issues early.
- **Backup first:** Before running migrations, back up your database (`sqlite3
db/production.sqlite3 ".backup backup.sqlite3"`) to avoid data loss.

Do I still love SQLite? But of course! However it comes with gotchas that you
must know to use it efficiently and avoid landmines.
