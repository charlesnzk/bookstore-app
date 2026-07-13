import {
  Container,
  Title,
  Table,
  Badge,
  Text,
  Accordion,
  Button,
  Group,
  Center,
  Loader,
  ThemeIcon,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import api from "../api/axios";

const STATUS_COLORS = {
  pending: "yellow",
  confirmed: "blue",
  shipped: "indigo",
  delivered: "green",
  cancelled: "red",
};

const STATUS_ICONS = {
  pending: "⏳",
  confirmed: "✅",
  shipped: "🚚",
  delivered: "📦",
  cancelled: "❌",
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/");
      setOrders(res.data.results || []);
    } catch {
      notifications.show({ message: "Failed to load orders.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order? Stock will be restored.")) return;
    try {
      await api.post(`/orders/${orderId}/cancel/`);
      notifications.show({ message: "Order cancelled.", color: "green" });
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to cancel order.";
      notifications.show({ message: msg, color: "red" });
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader aria-label="Loading orders" />
      </Center>
    );
  }

  return (
    <main>
      <Container size="xl" py="md">
        <Title order={1} mb="md">
          My Orders
        </Title>
        {orders.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">You have no orders yet.</Text>
          </Center>
        ) : (
          <Accordion
            multiple
            aria-label="Order history"
          >
            {orders.map((order) => (
              <Accordion.Item key={order.id} value={String(order.id)}>
                <Accordion.Control
                  aria-label={`Order ${order.id}, status: ${order.status}`}
                >
                  <Group>
                    <Badge
                      color={STATUS_COLORS[order.status]}
                      variant="light"
                      leftSection={STATUS_ICONS[order.status]}
                    >
                      {order.status}
                    </Badge>
                    <Text size="sm">
                      Order #{order.id} —{" "}
                      {new Date(order.date_submitted).toLocaleDateString()} —{" "}
                      {order.delivery_method}
                    </Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Table mb="sm" aria-label={`Items in order ${order.id}`}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Book</Table.Th>
                        <Table.Th>ISBN</Table.Th>
                        <Table.Th>Qty</Table.Th>
                        <Table.Th>Unit Price</Table.Th>
                        <Table.Th>Total</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {order.items.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>{item.book_title}</Table.Td>
                          <Table.Td>{item.book_isbn}</Table.Td>
                          <Table.Td>{item.quantity}</Table.Td>
                          <Table.Td>${item.price_at_purchase}</Table.Td>
                          <Table.Td>
                            ${(
                              item.quantity *
                              parseFloat(item.price_at_purchase)
                            ).toFixed(2)}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  {order.status === "pending" && (
                    <Button
                      color="red"
                      variant="light"
                      size="xs"
                      onClick={() => handleCancel(order.id)}
                      aria-label={`Cancel order ${order.id}`}
                    >
                      Cancel order
                    </Button>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Container>
    </main>
  );
}
