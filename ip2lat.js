var fs = require('fs');

let result = fs.readFileSync("ssh.out",'utf8')
console.log(result)