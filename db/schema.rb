# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20140810053239) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "acknowledgements", force: true do |t|
    t.text     "text"
    t.integer  "assistant_id", null: false
    t.integer  "project_id",   null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "acknowledgements", ["assistant_id"], name: "index_acknowledgements_on_assistant_id", using: :btree
  add_index "acknowledgements", ["project_id"], name: "index_acknowledgements_on_project_id", using: :btree

  create_table "assistants", force: true do |t|
    t.text     "full_name",     null: false
    t.text     "nick"
    t.text     "personal_page"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "friendly_id_slugs", force: true do |t|
    t.string   "slug",                      null: false
    t.integer  "sluggable_id",              null: false
    t.string   "sluggable_type", limit: 50
    t.string   "scope"
    t.datetime "created_at"
  end

  add_index "friendly_id_slugs", ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true, using: :btree
  add_index "friendly_id_slugs", ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type", using: :btree
  add_index "friendly_id_slugs", ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id", using: :btree
  add_index "friendly_id_slugs", ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type", using: :btree

  create_table "implementations", force: true do |t|
    t.integer  "project_id"
    t.integer  "technology_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "implementations", ["project_id"], name: "index_implementations_on_project_id", using: :btree
  add_index "implementations", ["technology_id"], name: "index_implementations_on_technology_id", using: :btree

  create_table "licences", force: true do |t|
    t.text     "name",       null: false
    t.text     "link"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "posts", force: true do |t|
    t.datetime "publish_date"
    t.text     "markdown"
    t.text     "html"
    t.text     "title"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "slug"
  end

  add_index "posts", ["slug"], name: "index_posts_on_slug", using: :btree

  create_table "project_urls", force: true do |t|
    t.integer  "project_id"
    t.text     "address"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "favicon_file_name"
    t.string   "favicon_content_type"
    t.integer  "favicon_file_size"
    t.datetime "favicon_updated_at"
  end

  add_index "project_urls", ["project_id"], name: "index_project_urls_on_project_id", using: :btree

  create_table "projects", force: true do |t|
    t.text     "title",              null: false
    t.text     "headline",                        comment: "Displayed on the index page"
    t.text     "description",        null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.date     "first_release_date"
    t.integer  "licence_id"
    t.text     "state"
  end

  add_index "projects", ["licence_id"], name: "index_projects_on_licence_id", using: :btree

  create_table "subordinations", force: true do |t|
    t.integer  "project_id"
    t.integer  "third_party_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "subordinations", ["project_id"], name: "index_subordinations_on_project_id", using: :btree
  add_index "subordinations", ["third_party_id"], name: "index_subordinations_on_third_party_id", using: :btree

  create_table "taggings", force: true do |t|
    t.integer  "tag_id"
    t.integer  "taggable_id"
    t.string   "taggable_type"
    t.integer  "tagger_id"
    t.string   "tagger_type"
    t.string   "context",       limit: 128
    t.datetime "created_at"
  end

  add_index "taggings", ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true, using: :btree
  add_index "taggings", ["taggable_id", "taggable_type", "context"], name: "index_taggings_on_taggable_id_and_taggable_type_and_context", using: :btree

  create_table "tags", force: true do |t|
    t.string  "name"
    t.integer "taggings_count", default: 0
  end

  add_index "tags", ["name"], name: "index_tags_on_name", unique: true, using: :btree

  create_table "technologies", force: true do |t|
    t.text     "name",       null: false
    t.text     "link"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "third_parties", force: true do |t|
    t.text     "name",       null: false
    t.text     "link"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "thumbnails", force: true, comment: "Every project has 1 thumbnail that is shown on the index page" do |t|
    t.integer  "project_id"
    t.text     "dimensions",           null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "picture_file_name"
    t.string   "picture_content_type"
    t.integer  "picture_file_size"
    t.datetime "picture_updated_at"
  end

  add_index "thumbnails", ["project_id"], name: "index_thumbnails_on_project_id", using: :btree

end
