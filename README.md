# Attack Map

A NodeJs application with Express that shows SSH hackers on a honeypot server.
This application gets logs from the honey pot server using rsyslog.
Once data from rsyslog is recieved the latitude and longitude are requested through an external API.
We memoize these IP address using redis using redis HMSET.
We also use redis to store the attempts using the unix epoch as the key.
The server when prompted for map.edwin.computer, returns SSH attempts within 30 minutes using redis ZRANGESCORE .

# How to run
Add this to your rsyslog.conf

```
template(name="OnlyMsg" type="string" string="%msg:::drop-last-lf%\n")
if $programname == 'sshd' then {
   if $msg startswith ' Failed' then {
      action(type="omfwd" target="{server running NodeJs}" port="{port running NodeJs Log server}" protocol="tcp" template="OnlyMsg")
   }
}

```
Other variables needed are listed in example.env

To run:
```
npm install
npm start
```

# TODO:

Front-end is questionable, It does the job but maybe change it to a globe in the future.
