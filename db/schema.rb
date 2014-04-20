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

ActiveRecord::Schema.define(version: 20140420092419) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "assistants", force: true do |t|
    t.text     "full_name",     null: false
    t.text     "nick"
    t.text     "personal_page"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "licences", force: true do |t|
    t.text     "name",       null: false
    t.text     "link"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "projects", force: true do |t|
    t.text     "title",       null: false
    t.text     "headline",                 comment: "Displayed on the index page"
    t.text     "description", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

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
