variable "trash_paths" {
  description = "Complete list of bot, hacker, and noise paths to block at the edge"
  type        = list(string)
  default     = [
    # --- Project Specific & Local Noise ---
    "/.well-known/appspecific/com.chrome.devtools.json", # Fixes your local logs!
    "/.vscode", "/.git/config", "/.ssh/id_rsa", "/.aws/credentials",
    
    # --- API Probes ---
    "/api/v1/config", "/api/v1/user/config", "/api/v1/setup", "/api/v1/admin",
    "/debug/default", "/solr", "/metrics", "/healthz",
    
    # --- WordPress & PHP Exploits ---
    "/wp-admin", "/wp-login.php", "/xmlrpc.php", "/wp-content/plugins",
    "/wp-config.php", "/wp-includes/", "/setup.php", "/install.php", 
    "/license.txt", "/readme.html",
    
    # --- Config & Environment Leaks ---
    "/.env", "/.env.local", "/.env.production", "/config.php", 
    "/configuration.php", "/web.config", "/phpinfo.php", "/info.php",
    
    # --- Database & Admin Tools ---
    "/phpmyadmin", "/pma", "/admin", "/administrator", "/myadmin",
    "/mysql", "/sql", "/backup.sql", "/dump.sql", "/db.sql",
    
    # --- Framework & Server Specific ---
    "/actuator/health", "/actuator/env", "/_search", "/app/kibana",
    "/autodiscover/autodiscover.xml", "/owa", "/ecp", "/remote/login",
    "/bitrix/admin", "/cgi-bin/config.exp", "/cgi-bin/php",
    
    # --- Backdoors & Archives ---
    "/shell.php", "/cmd.php", "/x.php", "/ws.php", 
    "/backup.zip", "/data.zip", "/site.zip", "/backup.tar.gz"
  ]
}
