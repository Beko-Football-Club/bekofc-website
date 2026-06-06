output "site_bucket_name"  { value = aws_s3_bucket.site.bucket }
output "media_bucket_name" { value = aws_s3_bucket.media.bucket }

output "route53_zone_name_servers" { value = aws_route53_zone.primary.name_servers }
output "acm_certificate_arn"       { value = aws_acm_certificate_validation.site.certificate_arn }
