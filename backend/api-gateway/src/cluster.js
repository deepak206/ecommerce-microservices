import cluster from "node:cluster";
import os from "node:os";

const availableCPUs = os.cpus().length;

const workerCount = Math.min(
  Number(process.env.WEB_CONCURRENCY) || 2,
  availableCPUs
);

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Available CPU cores: ${availableCPUs}`);
  console.log(`Starting ${workerCount} workers`);

  for (let i = 0; i < workerCount; i++) {
    const worker = cluster.fork();

    console.log(
      `Worker ${worker.id} started with PID ${worker.process.pid}`
    );
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `Worker ${worker.id} with PID ${worker.process.pid} stopped`,
      `code=${code}`,
      `signal=${signal}`
    );

    console.log("Starting replacement worker...");

    const replacement = cluster.fork();

    console.log(
      `Replacement worker ${replacement.id} started with PID ${replacement.process.pid}`
    );
  });
} else {
  await import("./server.js");
}