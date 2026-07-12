import {
  TextInput,
  PasswordInput,
  Button,
  Container,
  Title,
  Paper,
  Text,
  Anchor,
} from "@mantine/core";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      notifications.show({ message: "Welcome back!", color: "green" });
      navigate(user.is_admin ? "/admin/books" : "/");
    } catch {
      notifications.show({ message: "Invalid username or password.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" mt="xl">
      <Title ta="center" mb="md">
        Sign in
      </Title>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Username"
            required
            mb="sm"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <PasswordInput
            label="Password"
            required
            mb="md"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" fullWidth loading={loading}>
            Sign in
          </Button>
        </form>
        <Text ta="center" mt="sm" size="sm">
          No account?{" "}
          <Anchor component={Link} to="/register">
            Register
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
