# Standalone HTML bypasses _includes/head.html. Check the final output so new
# doodles, mdBook pages, and Jekyll pages cannot silently lose their analytics.
module AnalyticsCoverage
  TRACKER = %r{\Ahttps://analytics\.kyrylo\.org/js/pa-[\w-]+\.js\z}
  EXCLUDED = {
    "up.html" => "health check",
    "elsewhere/camera-frame.html" => "embedded camera; the parent page is tracked"
  }.freeze

  def self.issues(html, path)
    html = html.gsub(/<!--.*?-->/m, "")
    scripts = html.scan(/<script\b([^>]*)>(.*?)<\/script\s*>/mi)
    trackers = scripts.select do |attributes, _|
      src = attributes[/\bsrc\s*=\s*["']([^"']+)["']/i, 1]
      src && TRACKER.match?(src)
    end
    owlytics = scripts.select { |attributes, _| attributes.match?(%r{\bsrc=["']https://owlytics\.kyrylo\.org/script\.js["']}) }
    redirect = html.scan(/<meta\b[^>]*>/i).any? do |tag|
      tag.match?(/\bhttp-equiv\s*=\s*["']refresh["']/i)
    end

    if EXCLUDED.key?(path) || redirect
      return trackers.empty? && owlytics.empty? ? [] : ["#{path}: redirect or utility page must not track an extra pageview"]
    end

    problems = []
    problems << "#{path}: expected one Owlytics tracker, found #{owlytics.length}" unless owlytics.length == 1
    owlytics.each do |attributes, _|
      problems << "#{path}: Owlytics must use the kyrylo.org domain" unless attributes.match?(/\bdata-domain=["']kyrylo\.org["']/)
      problems << "#{path}: Owlytics must load asynchronously" unless attributes.match?(/(?:\A|\s)(?:defer|async)(?:\s|=|\z)/i)
    end
    problems << "#{path}: expected one Plausible tracker, found #{trackers.length}" unless trackers.length == 1
    if trackers.any? { |attributes, _| !attributes.match?(/(?:\A|\s)async(?:\s|=|\z)/i) }
      problems << "#{path}: Plausible must load asynchronously"
    end
    initializers = scripts.sum { |_, body| body.scan(/\bplausible\.init\s*\(/).length }
    problems << "#{path}: expected one plausible.init(), found #{initializers}" unless initializers == 1
    problems
  end

  def self.check(directory)
    Dir.glob(File.join(directory, "**", "*.html")).sort.flat_map do |file|
      issues(File.read(file, encoding: "UTF-8"), file.delete_prefix("#{directory}/"))
    end
  end
end

if defined?(Jekyll::Hooks)
  Jekyll::Hooks.register :site, :post_write do |site|
    problems = AnalyticsCoverage.check(site.dest)
    unless problems.empty?
      raise Jekyll::Errors::FatalException, "Plausible coverage failed:\n#{problems.join("\n")}"
    end
    Jekyll.logger.info "Plausible:", "all public HTML pages have one async tracker and initializer"
  end
end
