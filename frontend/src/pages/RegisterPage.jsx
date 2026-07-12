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
import api from "../api/axios";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
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
          <Button type="submit" fullWidth loading={loading}>
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
