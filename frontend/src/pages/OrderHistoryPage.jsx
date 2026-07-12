import {
  Container,
  Title,
  Table,
  Badge,
  Text,
  Accordion,
  Button,
  Group,
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

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await api.get("/orders/");
    setOrders(res.data.results || []);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api.post(`/orders/${orderId}/cancel/`);
      notifications.show({ message: "Order cancelled.", color: "green" });
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to cancel order.";
      notifications.show({ message: msg, color: "red" });
    }
  };

  if (orders.length === 0) {
    return (
      <Container size="xl">
        <Title mb="md">My Orders</Title>
        <Text c="dimmed">You have no orders yet.</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title mb="md">My Orders</Title>
      <Accordion multiple>
        {orders.map((order) => (
          <Accordion.Item key={order.id} value={String(order.id)}>
            <Accordion.Control>
              <Group>
                <Badge color={STATUS_COLORS[order.status]}>
                  {order.status}
                </Badge>
                <Text>
                  Order #{order.id} —{" "}
                  {new Date(order.date_submitted).toLocaleDateString()} —{" "}
                  {order.delivery_method}
                </Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Table mb="sm">
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
                >
                  Cancel order
                </Button>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Container>
  );
}
