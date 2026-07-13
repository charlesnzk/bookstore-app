import {
  Container,
  Title,
  Button,
  Table,
  Badge,
  Group,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  Center,
  Loader,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import api from "../api/axios";

const EMPTY_FORM = {
  isbn: "",
  title: "",
  description: "",
  price: "",
  stock: 0,
  availability: true,
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      const res = await api.get("/admin/books/");
      setBooks(res.data.results || []);
    } catch {
      notifications.show({ message: "Failed to load books.", color: "red" });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleOpen = (book = null) => {
    setEditing(book);
    setForm(book ? { ...book } : EMPTY_FORM);
    open();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) {
        await api.patch(`/admin/books/${editing.id}/`, form);
        notifications.show({ message: "Book updated.", color: "green" });
      } else {
        await api.post("/admin/books/", form);
        notifications.show({ message: "Book added.", color: "green" });
      }
      close();
      fetchBooks();
    } catch (err) {
      const data = err.response?.data;
      const message = data
        ? Object.values(data).flat().join(" ")
        : "Failed to save book.";
      notifications.show({ message, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/books/${id}/`);
      notifications.show({ message: "Book deleted.", color: "green" });
      fetchBooks();
    } catch {
      notifications.show({ message: "Failed to delete book.", color: "red" });
    }
  };

  if (pageLoading) {
    return (
      <Center h={400}>
        <Loader aria-label="Loading books" />
      </Center>
    );
  }

  return (
    <main>
      <Container size="xl" py="md">
        <Group justify="space-between" mb="md">
          <Title order={1}>Manage Books</Title>
          <Button onClick={() => handleOpen()} aria-label="Add a new book">
            Add book
          </Button>
        </Group>

        {books.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">No books yet. Add one to get started.</Text>
          </Center>
        ) : (
          <Table
            striped
            highlightOnHover
            aria-label="Book catalogue management"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>ISBN</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Stock</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {books.map((book) => (
                <Table.Tr key={book.id}>
                  <Table.Td>{book.title}</Table.Td>
                  <Table.Td>{book.isbn}</Table.Td>
                  <Table.Td>${book.price}</Table.Td>
                  <Table.Td>{book.stock}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={book.availability ? "green" : "red"}
                      variant="light"
                      aria-label={
                        book.availability ? "Available" : "Unavailable"
                      }
                    >
                      {book.availability ? "Available" : "Unavailable"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => handleOpen(book)}
                        aria-label={`Edit ${book.title}`}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(book.id, book.title)}
                        aria-label={`Delete ${book.title}`}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Modal
          opened={opened}
          onClose={close}
          title={editing ? `Edit: ${editing.title}` : "Add a new book"}
          aria-label={editing ? "Edit book" : "Add book"}
        >
          <TextInput
            label="ISBN"
            description="10 or 13 digits, numbers only"
            required
            mb="sm"
            value={form.isbn}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            aria-required="true"
          />
          <TextInput
            label="Title"
            required
            mb="sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            aria-required="true"
          />
          <Textarea
            label="Description"
            mb="sm"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <NumberInput
            label="Price ($)"
            required
            mb="sm"
            min={0.01}
            decimalScale={2}
            value={form.price}
            onChange={(v) => setForm({ ...form, price: v })}
            aria-required="true"
          />
          <NumberInput
            label="Stock"
            required
            mb="sm"
            min={0}
            value={form.stock}
            onChange={(v) => setForm({ ...form, stock: v })}
            aria-required="true"
          />
          <Switch
            label="Available for purchase"
            mb="md"
            checked={form.availability}
            onChange={(e) =>
              setForm({ ...form, availability: e.currentTarget.checked })
            }
            aria-label="Toggle book availability"
          />
          <Button fullWidth loading={loading} onClick={handleSave}>
            {editing ? "Save changes" : "Add book"}
          </Button>
        </Modal>
      </Container>
    </main>
  );
}
