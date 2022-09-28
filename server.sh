log_format json_output '{"time_local": "$time_local", '
   '"path": "$request_uri", '
   '"ip": "$remote_addr", '
   '"time": "$time_iso8601", '
   '"user_agent": "$http_user_agent", '
   '"user_id_got": "$uid_got", '
   '"user_id_set": "$uid_set", '
   '"remote_user": "$remote_user", '
   '"request": "$request", '
   '"status": "$status", '
   '"body_bytes_sent": "$body_bytes_sent", '
   '"request_time": "$request_time", '
   '"http_referrer": "$http_referer" }';


sudo apt-get install rsyslog-pgsql