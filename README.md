# Attack Map

This project went through different backends as I ran into a bunch of different problems and errors trying to make a product that worked. 

# How to run 
You could also use RSYSlog but for some pecuilar reason it did not want to work on my raspberry pi 4 and I took a couple days of work trying to figure it out.
The logs are parsed and sent by logstash.{add a link}
You could do many things such as use kibana and graphana and skip this but that process focuses more on the visualization and working with those tools. I did this mainlly because I want to learn some socket programming. 
I used python, no framework to create this application. I don't expect it to scale well to be honest but that is a problem for later. It probably won't do well if I get DDOS either but again oh well.

First start up your virtual enviorment.

```
python3 -m venv venv
source venv/bin/activate

I used dotenv to store secrets.
It contained HOST,PORT and IPDATA API Key.
```
# Structure

### Ideas Folder contains some of the first iterations.

# Ideas
I want to connect a honey pot later and then see what different types of attacks are used and then report those IP for malicious traffic.

I think the first visualization wont be the best but I just wanted a world map to see all the diffrent locations.

# Alternatives
If you were going to run all this from the same server you could just use grep and piping and then just transform the data.

```
tail -Fn0 /var/log/auth.log | grep --line-buffered "Failed password for" | grep --line-buffered -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' | {transform data} | {program to map data}
```

# Notes
Some commands I used to test the connection and see what data was coming into the logs.

```
tail -fn0 /var/log/messages | \  
while read line ; do  
       echo "$line" | grep "test"  
       if [ $? = 0 ]  
       echo "Running information gathering"  
       then 

Netcat:
client: Netcat [ip addr] [port]
server: Netcat -l -p port


tail -Fn0 /var/log/auth.log | grep --line-buffered "Failed password for" | grep --line-buffered -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' | nc 10.0.0.89 1999

nc -l -p 1999 | tee -a ssh.out

```