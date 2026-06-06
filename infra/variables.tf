variable "aws_account_id" {
  description = "The AWS account ID this stack is allowed to deploy into. Must match the account that the `default` profile resolves to."
  type        = string
}

variable "domain_name" {
  description = "Apex domain for the site."
  type        = string
  default     = "bekofc.com"
}

variable "site_bucket_name" {
  description = "S3 bucket name for the static site."
  type        = string
  default     = "bekofc-com-site"
}

variable "media_bucket_name" {
  description = "S3 bucket name for video/media uploads."
  type        = string
  default     = "bekofc-com-media"
}

variable "github_org" {
  description = "GitHub org that owns the repo."
  type        = string
  default     = "Beko-Football-Club"
}

variable "github_repo" {
  description = "GitHub repo name."
  type        = string
  default     = "bekofc-website"
}
