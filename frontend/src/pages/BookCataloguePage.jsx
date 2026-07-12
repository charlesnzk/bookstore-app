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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function BookCataloguePage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchBooks = async (q = "") => {
    const res = await api.get(`/books/${q ? `?search=${q}` : ""}`);
    setBooks(res.data.results || []);
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
      notifications.show({ message: "Order placed successfully!", color: "green" });
      close();
      fetchBooks(search);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to place order.";
      notifications.show({ message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl">
      <Title mb="md">Book Catalogue</Title>
      <TextInput
        placeholder="Search books..."
        mb="lg"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Grid>
        {books.map((book) => (
          <Grid.Col key={book.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card withBorder radius="md" h="100%">
              <Text fw={600} mb="xs" lineClamp={2}>
                {book.title}
              </Text>
              <Text size="sm" c="dimmed" mb="xs">
                ISBN: {book.isbn}
              </Text>
              <Text size="sm" mb="sm" lineClamp={3}>
                {book.description || "No description available."}
              </Text>
              <Group justify="space-between" mt="auto">
                <Text fw={700}>${book.price}</Text>
                <Badge color={book.availability ? "green" : "red"}>
                  {book.availability ? `${book.stock} left` : "Out of stock"}
                </Badge>
              </Group>
              <Button
                fullWidth
                mt="sm"
                disabled={!book.availability}
                onClick={() => handleBuy(book)}
              >
                Buy
              </Button>
            </Card>
          </Grid.Col>
        ))}
        {books.length === 0 && (
          <Grid.Col span={12}>
            <Text ta="center" c="dimmed">
              No books found.
            </Text>
          </Grid.Col>
        )}
      </Grid>

      <Modal opened={opened} onClose={close} title={`Buy: ${selected?.title}`}>
        <NumberInput
          label="Quantity"
          min={1}
          max={selected?.stock}
          value={quantity}
          onChange={setQuantity}
          mb="sm"
        />
        <Select
          label="Delivery method"
          mb="md"
          value={delivery}
          onChange={setDelivery}
          data={[
            { value: "standard", label: "Standard" },
            { value: "express", label: "Express" },
            { value: "pickup", label: "Self Pickup" },
          ]}
        />
        <Button fullWidth loading={loading} onClick={handleOrder}>
          Confirm order
        </Button>
      </Modal>
    </Container>
  );
}
