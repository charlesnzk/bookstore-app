import {
  Container,
  Title,
  TextInput,
  Grid,
  Card,
  Text,
  Badge,
  Button,
  Group,
  NumberInput,
  Modal,
  Select,
  Loader,
  Center,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { DELIVERY_OPTIONS } from "../constants";

export default function BookCataloguePage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchBooks = async (q = "") => {
    try {
      const res = await api.get(`/books/${q ? `?search=${q}` : ""}`);
      setBooks(res.data.results || []);
      setTotal(res.data.count || 0);
    } catch {
      notifications.show({ message: "Failed to load books.", color: "red" });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchBooks(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleBuy = (book) => {
    setSelected(book);
    setQuantity(1);
    open();
  };

  const handleOrder = async () => {
    setLoading(true);
    try {
      await api.post("/orders/create/", {
        delivery_method: delivery,
        items: [{ book_id: selected.id, quantity }],
      });
      notifications.show({
        message: "Order placed successfully!",
        color: "green",
      });
      close();
      fetchBooks(search);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to place order.";
      notifications.show({ message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Center h={400}>
        <Loader aria-label="Loading books" />
      </Center>
    );
  }

  const availableBooks = books.filter((b) => b.availability);
  const unavailableBooks = books.filter((b) => !b.availability);

  return (
    <main>
      <Container size="xl" py="md">
        <Group justify="space-between" mb="md">
          <Title order={1}>Book Catalogue</Title>
          <Text c="dimmed" size="sm">
            {total} {total === 1 ? "book" : "books"} total
          </Text>
        </Group>
        <TextInput
          placeholder="Search by title..."
          mb="lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search books by title"
        />

        {books.length === 0 ? (
          <Center h={200}>
            <Stack align="center">
              <Text c="dimmed">No books found.</Text>
              {search && (
                <Button variant="subtle" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <>
            {availableBooks.length > 0 && (
              <>
                <Text fw={600} mb="sm">
                  Available ({availableBooks.length})
                </Text>
                <Grid mb="xl">
                  {availableBooks.map((book) => (
                    <Grid.Col
                      key={book.id}
                      span={{ base: 12, sm: 6, md: 4, lg: 3 }}
                    >
                      <Card
                        withBorder
                        radius="md"
                        h="100%"
                        style={{ display: "flex", flexDirection: "column" }}
                        aria-label={`${book.title}, ISBN ${book.isbn}`}
                      >
                        <Text fw={600} mb="xs" lineClamp={2} size="md">
                          {book.title}
                        </Text>
                        <Text size="xs" c="dimmed" mb="xs">
                          ISBN: {book.isbn}
                        </Text>
                        <Text size="sm" mb="sm" lineClamp={3} c="dimmed">
                          {book.description || "No description available."}
                        </Text>
                        <Group justify="space-between" mt="auto" mb="sm">
                          <Text fw={700} size="lg">
                            ${book.price}
                          </Text>
                          <Badge
                            color="green"
                            variant="light"
                            aria-label={`${book.stock} copies in stock`}
                          >
                            {book.stock} left
                          </Badge>
                        </Group>
                        {!user?.is_admin && (
                          <Button
                            fullWidth
                            onClick={() => handleBuy(book)}
                            aria-label={`Buy ${book.title}`}
                          >
                            Buy
                          </Button>
                        )}
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </>
            )}

            {unavailableBooks.length > 0 && (
              <>
                <Text fw={600} mb="sm" c="dimmed">
                  Out of stock ({unavailableBooks.length})
                </Text>
                <Grid>
                  {unavailableBooks.map((book) => (
                    <Grid.Col
                      key={book.id}
                      span={{ base: 12, sm: 6, md: 4, lg: 3 }}
                    >
                      <Card
                        withBorder
                        radius="md"
                        h="100%"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          opacity: 0.6,
                        }}
                        aria-label={`${book.title}, out of stock`}
                      >
                        <Text fw={600} mb="xs" lineClamp={2} size="md">
                          {book.title}
                        </Text>
                        <Text size="xs" c="dimmed" mb="xs">
                          ISBN: {book.isbn}
                        </Text>
                        <Text size="sm" mb="sm" lineClamp={3} c="dimmed">
                          {book.description || "No description available."}
                        </Text>
                        <Group justify="space-between" mt="auto" mb="sm">
                          <Text fw={700} size="lg">
                            ${book.price}
                          </Text>
                          <Badge color="red" variant="light">
                            Out of stock
                          </Badge>
                        </Group>
                        {!user?.is_admin && (
                          <Button
                            fullWidth
                            disabled
                            aria-label={`${book.title} is out of stock`}
                          >
                            Out of stock
                          </Button>
                        )}
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}

        <Modal
          opened={opened}
          onClose={close}
          title={`Order: ${selected?.title}`}
          aria-label="Place order"
        >
          <Text size="sm" c="dimmed" mb="sm">
            Price: ${selected?.price} per copy
          </Text>
          <NumberInput
            label="Quantity"
            min={1}
            max={selected?.stock}
            value={quantity}
            onChange={setQuantity}
            mb="sm"
            aria-label="Select quantity"
          />
          <Text size="xs" c="dimmed" mb="sm">
            Total: ${(quantity * parseFloat(selected?.price || 0)).toFixed(2)}
          </Text>
          <Select
            label="Delivery method"
            mb="md"
            value={delivery}
            onChange={setDelivery}
            data={DELIVERY_OPTIONS}
            aria-label="Select delivery method"
          />
          <Button fullWidth loading={loading} onClick={handleOrder}>
            Confirm order
          </Button>
        </Modal>
      </Container>
    </main>
  );
}
