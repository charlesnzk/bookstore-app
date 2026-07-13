import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  RingProgress,
  Group,
  Center,
  Loader,
  Badge,
  Alert,
} from "@mantine/core";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { notifications } from "@mantine/notifications";

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

const DELIVERY_LABELS = {
  standard: "Standard",
  express: "Express",
  pickup: "Self Pickup",
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats/")
      .then((res) => setStats(res.data))
      .catch(() =>
        notifications.show({ message: "Failed to load stats.", color: "red" })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Center h={400}>
        <Loader aria-label="Loading dashboard" />
      </Center>
    );
  }

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
    <main>
      <Container size="xl" py="md">
        <Title order={1} mb="lg">
          Dashboard
        </Title>

        {stats.low_stock_books > 0 && (
          <Alert color="yellow" mb="lg" aria-live="polite">
            ⚠️ {stats.low_stock_books}{" "}
            {stats.low_stock_books === 1 ? "book is" : "books are"} running
            low on stock (3 or fewer remaining).
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="xl">
          <Card withBorder radius="md" aria-label="Total orders">
            <Text size="sm" c="dimmed" mb="xs">
              Total orders
            </Text>
            <Text size="xl" fw={700}>
              {stats.total_orders}
            </Text>
          </Card>
          <Card withBorder radius="md" aria-label="Total books">
            <Text size="sm" c="dimmed" mb="xs">
              Total books
            </Text>
            <Text size="xl" fw={700}>
              {stats.total_books}
            </Text>
            {stats.out_of_stock_books > 0 && (
              <Text size="xs" c="red" mt="xs">
                {stats.out_of_stock_books} out of stock
              </Text>
            )}
          </Card>
          <Card withBorder radius="md" aria-label="Total customers">
            <Text size="sm" c="dimmed" mb="xs">
              Total customers
            </Text>
            <Text size="xl" fw={700}>
              {stats.total_customers}
            </Text>
          </Card>
          <Card withBorder radius="md" aria-label="Total revenue from delivered orders">
            <Text size="sm" c="dimmed" mb="xs">
              Revenue (delivered orders)
            </Text>
            <Text size="xl" fw={700}>
              ${stats.total_revenue.toFixed(2)}
            </Text>
          </Card>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Card withBorder radius="md">
            <Text fw={600} mb="md">
              Orders by status
            </Text>
            <Center mb="sm">
              <RingProgress
                size={160}
                sections={sections}
                aria-label="Orders by status chart"
              />
            </Center>
            {Object.entries(stats.orders_by_status).map(([s, count]) => (
              <Group key={s} justify="space-between" py="xs">
                <Group gap="xs">
                  <Text size="sm">{STATUS_ICONS[s]}</Text>
                  <Text tt="capitalize" size="sm">
                    {s}
                  </Text>
                </Group>
                <Badge
                  color={STATUS_COLORS[s]}
                  variant="light"
                  aria-label={`${count} ${s} orders`}
                >
                  {count}
                </Badge>
              </Group>
            ))}
          </Card>

          <Card withBorder radius="md">
            <Text fw={600} mb="md">
              Orders by delivery method
            </Text>
            {Object.entries(stats.orders_by_delivery).map(([method, count]) => (
              <Group key={method} justify="space-between" py="xs">
                <Text size="sm">{DELIVERY_LABELS[method]}</Text>
                <Badge variant="light" aria-label={`${count} ${method} orders`}>
                  {count}
                </Badge>
              </Group>
            ))}
          </Card>
        </SimpleGrid>
      </Container>
    </main>
  );
}
