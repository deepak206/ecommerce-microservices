import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "invoice-service",
  brokers: [
    process.env.KAFKA_BROKER || "localhost:29092",
  ],
});

const consumer = kafka.consumer({
  groupId: "invoice-service",
});

export async function connectKafka() {
  await consumer.connect();

  console.log("Invoice Service connected to Kafka");

  await consumer.subscribe({
    topic: "order-events",
    fromBeginning: false,
  });

  console.log("Invoice Service subscribed to order-events");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(
          message.value.toString()
        );

        console.log(
          "\n📄 Invoice Service received Kafka event:"
        );

        console.log(event);

        if (event.eventType === "order.created") {
          await generateInvoice(event);
        }
      } catch (error) {
        console.error(
          "Failed to process Kafka message:",
          error
        );
      }
    },
  });
}

async function generateInvoice(event) {
  console.log("\n🧾 Generating invoice from Kafka...");

  console.log(`Order ID: ${event.orderId}`);
  console.log(`User ID: ${event.userId}`);
  console.log(`Amount: ₹${event.totalAmount}`);

  console.log("Items:");

  for (const item of event.items || []) {
    console.log(
      `- ${item.name} x ${item.quantity} = ₹${
        item.price * item.quantity
      }`
    );
  }

  console.log("✅ Invoice generated successfully");
}