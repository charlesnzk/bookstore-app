import {
  Container,
  Title,
  Table,
  Badge,
  Text,
  Accordion,
} from "@mantine/core";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    api.get("/orders/").then((res) => setOrders(res.data.results || []));
  }, []);

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
      <Accordion>
        {orders.map((order) => (
          <Accordion.Item key={order.id} value={String(order.id)}>
            <Accordion.Control>
              <Badge color={STATUS_COLORS[order.status]} mr="sm">
                {order.status}
              </Badge>
              Order #{order.id} —{" "}
              {new Date(order.date_submitted).toLocaleDateString()} —{" "}
              {order.delivery_method}
            </Accordion.Control>
            <Accordion.Panel>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Book</Table.Th>
                    <Table.Th>ISBN</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Price</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {order.items.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>{item.book_title}</Table.Td>
                      <Table.Td>{item.book_isbn}</Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>${item.price_at_purchase}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Container>
  );
}
