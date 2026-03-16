UPDATE proxy_host SET forward_host = 'baserow_app' WHERE forward_host = 'caddy' OR forward_host = 'baserow';
