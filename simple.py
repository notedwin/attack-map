import subprocess
bashCommand = "nc -l -p 1999"
process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
output, error = process.communicate()