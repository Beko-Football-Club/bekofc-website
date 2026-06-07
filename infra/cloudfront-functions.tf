resource "aws_cloudfront_function" "url_rewrite" {
  name    = "bekofc-url-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite URLs"
  publish = true
  code    = file("${path.module}/cloudfront-function.js")
}
