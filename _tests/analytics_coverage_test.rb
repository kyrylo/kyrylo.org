require "minitest/autorun"
require "tmpdir"
require_relative "../_plugins/analytics_coverage"

class AnalyticsCoverageTest < Minitest::Test
  SNIPPET = <<~HTML.freeze
    <script async src="https://analytics.kyrylo.org/js/pa-example.js"></script>
    <script>
      window.plausible = window.plausible || function () {};
      plausible.init = plausible.init || function () {};
      plausible.init()
    </script>
  HTML

  def test_standalone_page_needs_tracker_and_initializer
    assert_equal 2, AnalyticsCoverage.issues("<head></head>", "new-doodle/index.html").length
    assert_empty AnalyticsCoverage.issues("<head>#{SNIPPET}</head>", "new-doodle/index.html")
  end

  def test_duplicate_pageviews_are_rejected
    problems = AnalyticsCoverage.issues(SNIPPET * 2, "index.html")
    assert problems.any? { |p| p.include?("tracker, found 2") }
    assert problems.any? { |p| p.include?("init(), found 2") }
  end

  def test_uninitialized_or_blocking_tracker_is_rejected
    refute_empty AnalyticsCoverage.issues(SNIPPET.sub("plausible.init()", ""), "index.html")
    refute_empty AnalyticsCoverage.issues(SNIPPET.sub(" async", ""), "index.html")
  end

  def test_commented_snippet_does_not_count
    assert_equal 2, AnalyticsCoverage.issues("<!-- #{SNIPPET} -->", "index.html").length
  end

  def test_redirects_and_utility_pages_do_not_count_extra_views
    redirect = '<meta http-equiv="refresh" content="0;url=/elsewhere/">'
    assert_empty AnalyticsCoverage.issues(redirect, "same24/index.html")
    refute_empty AnalyticsCoverage.issues(redirect + SNIPPET, "same24/index.html")
    AnalyticsCoverage::EXCLUDED.each_key do |path|
      assert_empty AnalyticsCoverage.issues("<head></head>", path)
      refute_empty AnalyticsCoverage.issues(SNIPPET, path)
    end
    refute_empty AnalyticsCoverage.issues("<head></head>", "some-other-frame.html")
  end

  def test_scan_catches_new_nested_pages_and_ignores_assets
    Dir.mktmpdir do |directory|
      Dir.mkdir("#{directory}/new-doodle")
      File.write("#{directory}/index.html", "<title>Café</title>#{SNIPPET}")
      File.write("#{directory}/new-doodle/index.html", "<head></head>")
      File.write("#{directory}/drawing.js", "// no analytics needed")
      problems = AnalyticsCoverage.check(directory)
      assert_equal 2, problems.length
      assert problems.all? { |p| p.start_with?("new-doodle/index.html:") }
    end
  end

  def test_all_deployed_html_has_analytics_coverage
    assert_empty AnalyticsCoverage.check(File.expand_path("../_site", __dir__))
  end
end
