output "api_base_url" {
  value       = aws_apigatewayv2_api.api.api_endpoint
  description = "Base URL for the HTTP API"
}

output "site_url" {
  value       = "http://${aws_s3_bucket.site.bucket}.s3-website-${var.aws_region}.amazonaws.com"
  description = "S3 static website URL"
}

