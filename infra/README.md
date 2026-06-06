# BEKO FC Infrastructure

All AWS resources for this project live in account **053329825408**, accessed via the `default` profile in `~/.aws/config` (the user's "personal" AWS account).

## Hard rule

Every Terraform apply MUST target this account. The provider block in `main.tf` includes an `allowed_account_ids` constraint that aborts apply if `aws sts get-caller-identity` returns any other account. Do not edit this constraint.

## Apply order

1. `terraform init` — initializes backend and providers
2. `terraform plan` — review changes
3. `terraform apply` — apply

## Region

Primary region: `us-east-1` (required for CloudFront ACM certs; we colocate the rest there for simplicity at this scale).

## Runbook

- **Domain renewal:** managed by Route 53 (auto-renew can be enabled in the Route 53 console).
- **Cert renewal:** ACM auto-renews when DNS validation records are present in the hosted zone (Terraform creates them).
- **State location:** `s3://bekofc-tf-state/infra/terraform.tfstate` (created in Task 2).
