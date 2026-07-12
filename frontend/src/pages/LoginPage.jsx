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
import { Link, useNavigate, Navigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await login(form.username, form.password);
      notifications.show({ message: "Welcome back!", color: "green" });
      navigate(loggedInUser.is_admin ? "/admin/books" : "/");
    } catch {
      notifications.show({
        message: "Invalid username or password.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
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
          <Button type="submit" fullWidth loading={submitting}>
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
