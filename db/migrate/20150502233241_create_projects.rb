class CreateProjects < ActiveRecord::Migration[4.2]
  def up
    create_table :projects do |t|
      t.date :release_date
      t.boolean :released, default: true
      t.text :title
      t.text :html
      t.text :markdown
      t.text :slug, unique: true
      t.text :description

      t.timestamps null: false
    end

    add_index :projects, :slug, unique: true
  end

  def down
    Project.all.each do |project|
      p = Post.new

      p.title = project.title
      p.created_at = project.released
      p.markdown = project.markdown
      p.html = project.html
      p.tag_list.add('project')

      p.save!
      project.destroy!
    end

    drop_table :projects
  end
end
