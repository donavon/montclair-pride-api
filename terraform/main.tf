resource "cloudflare_ruleset" "block_bot_trash" {
  zone_id     = var.cloudflare_zone_id
  name        = "Block Hacker Trash"
  description = "Stops bots from hitting expensive Worker execution cycles"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action      = "block"
    expression  = "(http.request.uri.path in {${join(" ", formatlist("\"%s\"", var.trash_paths))}})"
    description = "Block high-frequency bot paths"
    enabled     = true
  }
}
