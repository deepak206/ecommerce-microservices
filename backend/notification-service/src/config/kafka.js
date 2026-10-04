import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [
    process.env.KAFKA_BROKER || "localhost:29092",
  ],
});

const consumer = kafka.consumer({
  groupId: "notification-service",
});

export async function connectKafka() {
  await consumer.connect();

  console.log("Notification Service connected to Kafka");

  await consumer.subscribe({
    topic: "order-events",
    fromBeginning: false,
  });

  console.log("Notification Service subscribed to order-events");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(
          message.value.toString()
        );

        console.log(
          "\n🔔 Notification Service received Kafka event:"
        );

        console.log(event);

        if (event.eventType === "order.created") {
          await sendOrderNotification(event);
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

async function sendOrderNotification(event) {
  console.log("\n📧 Sending order notification...");

  console.log(`Order ID: ${event.orderId}`);
  console.log(`User ID: ${event.userId}`);
  console.log(`Amount: ₹${event.totalAmount}`);

  console.log("✅ Order notification sent");
}