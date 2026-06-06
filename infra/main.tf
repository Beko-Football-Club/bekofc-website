provider "aws" {
  region              = "us-east-1"
  allowed_account_ids = [var.aws_account_id]
}

# us-east-1 alias (CloudFront/ACM live here)
provider "aws" {
  alias               = "us_east_1"
  region              = "us-east-1"
  allowed_account_ids = [var.aws_account_id]
}

data "aws_caller_identity" "current" {}

# Hard fail if the account being applied to does not match var.aws_account_id.
# This is belt-and-suspenders — `allowed_account_ids` already enforces it,
# but this gives a clearer error message during `terraform plan`.
resource "null_resource" "account_assertion" {
  lifecycle {
    precondition {
      condition     = data.aws_caller_identity.current.account_id == var.aws_account_id
      error_message = "Active AWS account (${data.aws_caller_identity.current.account_id}) does not match the project's pinned account (${var.aws_account_id}). Refusing to apply."
    }
  }
}
