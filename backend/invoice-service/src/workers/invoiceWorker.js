import { parentPort, workerData } from "node:worker_threads";

function generateInvoice(data) {
  console.log(
    `Worker ${process.pid} processing invoice for order ${data.orderId}`
  );

  // Simulate CPU-intensive work
  let result = 0;

  for (let i = 0; i < 50_000_000; i++) {
    result += i;
  }

  return {
    orderId: data.orderId,
    totalAmount: data.totalAmount,
    invoiceNumber: `INV-${data.orderId}`,
    calculationResult: result,
  };
}

try {
  const invoice = generateInvoice(workerData);

  parentPort.postMessage({
    success: true,
    invoice,
  });
} catch (error) {
  parentPort.postMessage({
    success: false,
    error: error.message,
  });
}