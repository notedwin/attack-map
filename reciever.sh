#!/bin/bash

timestamp() {
  date +"%T" # current time
}


nc -l -p 1999 | tee -a ssh.out
jq '{ip_address:.,time:timestamp()}'