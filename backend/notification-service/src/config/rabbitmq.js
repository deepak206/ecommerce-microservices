import amqp from "amqplib";

let connection;
let channel;

const EXCHANGE_NAME = "ecommerce.events";
const QUEUE_NAME = "notification-service";
const ROUTING_KEY = "order.created";

export async function connectRabbitMQ() {
  if (!process.env.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is required");
  }

  connection = await amqp.connect(process.env.RABBITMQ_URL);

  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", {
    durable: true,
  });

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  await channel.bindQueue(
    QUEUE_NAME,
    EXCHANGE_NAME,
    ROUTING_KEY
  );

  console.log("Notification Service connected to RabbitMQ");
  console.log(`Queue: ${QUEUE_NAME}`);
  console.log(`Listening for: ${ROUTING_KEY}`);

  await channel.consume(QUEUE_NAME, async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = JSON.parse(
        message.content.toString()
      );

      console.log("\n📩 Notification Service received event:");
      console.log(event);

      await handleOrderCreated(event);

      channel.ack(message);
    } catch (error) {
      console.error(
        "Failed to process notification event:",
        error
      );

      channel.nack(message, false, false);
    }
  });

  connection.on("error", (error) => {
    console.error(
      "RabbitMQ connection error:",
      error.message
    );
  });

  connection.on("close", () => {
    console.error("RabbitMQ connection closed");
  });
}

async function handleOrderCreated(event) {
  console.log("\n📧 Sending order confirmation notification...");
  console.log(`Order ID: ${event.orderId}`);
  console.log(`User ID: ${event.userId}`);
  console.log(`Amount: ₹${event.totalAmount}`);

  // Later we will integrate:
  // - Email provider
  // - SMS
  // - Push notification

  console.log("✅ Order confirmation notification sent");
}