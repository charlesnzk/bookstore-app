import {
  Container,
  Title,
  Table,
  Badge,
  Select,
  Group,
  Text,
  Accordion,
  Center,
  Loader,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { STATUS_COLORS, STATUS_ICONS, STATUS_OPTIONS } from "../constants";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (status = "") => {
    try {
      const res = await api.get(
        `/admin/orders/${status ? `?status=${status}` : ""}`
      );
      setOrders(res.data.results || []);
    } catch {
      notifications.show({ message: "Failed to load orders.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(filter);
  }, [filter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/`, { status: newStatus });
      notifications.show({ message: "Order status updated.", color: "green" });
      fetchOrders(filter);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to update status.";
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
        <Group justify="space-between" mb="md">
          <Title order={1}>Manage Orders</Title>
          <Select
            placeholder="Filter by status"
            clearable
            data={STATUS_OPTIONS}
            value={filter}
            onChange={(v) => setFilter(v || "")}
            w={200}
            aria-label="Filter orders by status"
          />
        </Group>

        {orders.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No orders found.</Text>
          </Center>
        ) : (
          <Accordion multiple aria-label="Order management">
            {orders.map((order) => (
              <Accordion.Item key={order.id} value={String(order.id)}>
                <Accordion.Control
                  aria-label={`Order ${order.id} by ${order.username}, status: ${order.status}`}
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
                      Order #{order.id} — {order.username} —{" "}
                      {new Date(order.date_submitted).toLocaleDateString()}
                    </Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Table mb="sm" aria-label={`Items in order ${order.id}`}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Book</Table.Th>
                        <Table.Th>Qty</Table.Th>
                        <Table.Th>Unit Price</Table.Th>
                        <Table.Th>Total</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {order.items.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>{item.book_title}</Table.Td>
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
                  <Select
                    label="Update status"
                    data={STATUS_OPTIONS}
                    value={order.status}
                    onChange={(v) => handleStatusChange(order.id, v)}
                    w={200}
                    aria-label={`Update status for order ${order.id}`}
                    disabled={order.status === "cancelled"}
                  />
                  {order.status === "cancelled" && (
                    <Text size="xs" c="dimmed" mt="xs">
                      Cancelled orders cannot be updated.
                    </Text>
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
