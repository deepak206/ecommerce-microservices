
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "order-service",
  brokers: [
    process.env.KAFKA_BROKER || "localhost:29092",
  ],
});

const producer = kafka.producer();

let connected = false;

export async function connectKafka() {
  if (connected) return;

  await producer.connect();
  connected = true;

  console.log("Order Service connected to Kafka");
}

export async function publishKafkaEvent(eventType, data) {
  if (!connected) {
    throw new Error("Kafka producer is not connected");
  }

  await producer.send({
    topic: "order-events",
    messages: [
      {
        key: String(data.orderId),
        value: JSON.stringify({
          eventType,
          ...data,
        }),
      },
    ],
  });

  console.log(`Kafka event published: ${eventType}`);
}
