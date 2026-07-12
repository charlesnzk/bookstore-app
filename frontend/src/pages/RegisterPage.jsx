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
import api from "../api/axios";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/register/", form);
      notifications.show({
        message: "Account created! Please sign in.",
        color: "green",
      });
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      const message = data
        ? Object.values(data).flat().join(" ")
        : "Registration failed.";
      notifications.show({ message, color: "red" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="xs" mt="xl">
      <Title ta="center" mb="md">
        Create account
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
          <TextInput
            label="Email"
            type="email"
            mb="sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <PasswordInput
            label="Password"
            required
            mb="sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <PasswordInput
            label="Confirm password"
            required
            mb="md"
            value={form.password2}
            onChange={(e) => setForm({ ...form, password2: e.target.value })}
          />
          <Button type="submit" fullWidth loading={submitting}>
            Create account
          </Button>
        </form>
        <Text ta="center" mt="sm" size="sm">
          Already have an account?{" "}
          <Anchor component={Link} to="/login">
            Sign in
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
