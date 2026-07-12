import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  RingProgress,
  Group,
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

export default function AdminStatsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats/").then((res) => setStats(res.data));
  }, []);

  if (!stats) return null;

  const total = stats.total_orders || 1;
  const sections = Object.entries(stats.orders_by_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      value: Math.round((count / total) * 100),
      color: STATUS_COLORS[status],
      tooltip: `${status}: ${count}`,
    }));

  return (
    <Container size="xl">
      <Title mb="lg">Dashboard</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="xl">
        <Card withBorder radius="md">
          <Text size="sm" c="dimmed">
            Total orders
          </Text>
          <Text size="xl" fw={700}>
            {stats.total_orders}
          </Text>
        </Card>
        <Card withBorder radius="md">
          <Text size="sm" c="dimmed">
            Total books
          </Text>
          <Text size="xl" fw={700}>
            {stats.total_books}
          </Text>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" maw={400}>
        <Text fw={600} mb="md">
          Orders by status
        </Text>
        <Group justify="center" mb="sm">
          <RingProgress size={180} sections={sections} />
        </Group>
        {Object.entries(stats.orders_by_status).map(([s, count]) => (
          <Group key={s} justify="space-between">
            <Text tt="capitalize" size="sm">
              {s}
            </Text>
            <Text size="sm" fw={600}>
              {count}
            </Text>
          </Group>
        ))}
      </Card>
    </Container>
  );
}
