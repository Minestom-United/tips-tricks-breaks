source "https://rubygems.org"

# Local preview only — GitHub Pages builds with its own gem versions.
# NOTE: the `github-pages` meta-gem does not install on Ruby 3.4 (pins ancient
# dependencies), so local preview uses plain Jekyll + the same three plugins
# the site declares in _config.yml. Close enough to catch build breakage.
# Usage: bundle install && bundle exec jekyll serve
gem "jekyll", "~> 4.3"
gem "jekyll-feed"
gem "jekyll-seo-tag"
gem "jekyll-sitemap"
gem "webrick" # `jekyll serve` needs an HTTP server on Ruby 3+

# Ruby 3.4 slim installs ship without these former default gems;
# declaring them keeps `bundle exec` able to resolve `require` calls.
gem "erb"
gem "csv"
gem "base64"
gem "logger"
