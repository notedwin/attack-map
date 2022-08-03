# Attack Map

A rust application using regex to continously parse the log file at /var/log/auth.log and store information about failed login attempts in a database.
Most data is recieved from the log file, however using the IP address we cam get the (rough) location of a user.

When going to [map](https://map.notedwin.com) you can see the location of the user who failed to login within the past 5 hours.

# How to run

You will need 2 processes running:

- log_parser: This process will continously parse the log file and store the information in a database.
- web-server: This asyncronously fufill requests to map.notedwin

```bash
./log_ingestion '/var/log/auth.log' 'redis://user:password@localhost:6379'
./web-server '/var/log/auth.log' 'redis://user:password@localhost:6379'
```

```bash
cargo clippy --fix --allow-staged --allow-dirty -- -W clippy::pedantic \
-W clippy::nursery -W clippy::unwrap_used -W clippy::expect_used 
```
