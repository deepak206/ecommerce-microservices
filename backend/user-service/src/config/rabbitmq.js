import amqp from "amqplib";

let channel;

export async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);

  channel = await connection.createConfirmChannel();

  await channel.assertExchange("ecommerce.events", "topic", {
    durable: true,
  });

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error.message);
  });

  connection.on("close", () => {
    channel = undefined;
    console.error("RabbitMQ connection closed. Restart the service if needed.");
  });

  console.log("Connected to RabbitMQ");
}

export async function publishEvent(routingKey, payload) {
  if (!channel) {
    throw new Error("RabbitMQ is not connected");
  }

  channel.publish(
    "ecommerce.events",
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
      contentType: "application/json",
      timestamp: Date.now(),
    }
  );

  await channel.waitForConfirms();
}