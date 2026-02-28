terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  # This will look for an environment variable named CLOUDFLARE_API_TOKEN
  # Do not hardcode the token here!
}
