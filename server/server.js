const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;
console.log(numCPUs);

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new worker.`);
    cluster.fork();
  });
} else {
  // Workers share the TCP connection here
  require("./app"); // Your Express app runs here

  console.log(`Worker ${process.pid} started`);
}
