cd /var/log/nginx/
awk -v FPAT='\\[[^][]*]|"[^"]*"|\\S+' '{
  for(i=1; i<=NF; i++) {
    print "$"i" = ", $i
  }
}' < access.log

// regex to match nginx access.log
r = r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) - - \[(\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2} \+\d{4})\] \"(\w+) ([^ ]+) HTTP/(\d\.\d)\" (\d{3}) (\d+) \"([^\"]+)\" \"([^\"]+)\""