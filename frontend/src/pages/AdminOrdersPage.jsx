import {
  Container,
  Title,
  Table,
  Badge,
  Select,
  Group,
  Text,
  Accordion,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import api from "../api/axios";

const STATUS_COLORS = {
  pending: "yellow",
  confirmed: "blue",
  shipped: "indigo",
  delivered: "green",
  cancelled: "red",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");

  const fetchOrders = async (status = "") => {
    const res = await api.get(`/admin/orders/${status ? `?status=${status}` : ""}`);
    setOrders(res.data.results || []);
  };

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/`, { status: newStatus });
      notifications.show({ message: "Order status updated.", color: "green" });
      fetchOrders(filter);
    } catch {
      notifications.show({ message: "Failed to update status.", color: "red" });
    }
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title>Manage Orders</Title>
        <Select
          placeholder="Filter by status"
          clearable
          data={STATUS_OPTIONS}
          value={filter}
          onChange={(v) => setFilter(v || "")}
          w={200}
        />
      </Group>

      {orders.length === 0 ? (
        <Text c="dimmed">No orders found.</Text>
      ) : (
        <Accordion>
          {orders.map((order) => (
            <Accordion.Item key={order.id} value={String(order.id)}>
              <Accordion.Control>
                <Group>
                  <Badge color={STATUS_COLORS[order.status]}>
                    {order.status}
                  </Badge>
                  <Text>
                    Order #{order.id} — {order.username} —{" "}
                    {new Date(order.date_submitted).toLocaleDateString()}
                  </Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Table mb="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Book</Table.Th>
                      <Table.Th>Qty</Table.Th>
                      <Table.Th>Price</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {order.items.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>{item.book_title}</Table.Td>
                        <Table.Td>{item.quantity}</Table.Td>
                        <Table.Td>${item.price_at_purchase}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <Select
                  label="Update status"
                  data={STATUS_OPTIONS}
                  value={order.status}
                  onChange={(v) => handleStatusChange(order.id, v)}
                  w={200}
                />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
}
