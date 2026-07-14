import { Group, Button, Container, Text } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header role="banner" style={{ borderBottom: "1px solid #e9ecef" }}>
      <Container size="xl" py="sm">
        <Group justify="space-between">
          <Text
            fw={700}
            size="lg"
            component={Link}
            to="/"
            style={{ textDecoration: "none" }}
            aria-label="Bookstore home"
          >
            📚 Bookstore
          </Text>
          <nav aria-label="Main navigation">
            <Group>
              {user ? (
                <>
                  <Text size="sm" c="dimmed">
                    Hi, {user.username}
                  </Text>
                  <Button
                    variant="subtle"
                    component={Link}
                    to="/"
                    aria-current="page"
                  >
                    Books
                  </Button>
                  {user.is_admin ? (
                    <>
                      <Button
                        variant="subtle"
                        component={Link}
                        to="/admin/books"
                      >
                        Manage Books
                      </Button>
                      <Button
                        variant="subtle"
                        component={Link}
                        to="/admin/orders"
                      >
                        Manage Orders
                      </Button>
                      <Button
                        variant="subtle"
                        component={Link}
                        to="/admin/stats"
                      >
                        Stats
                      </Button>
                    </>
                  ) : (
                    <Button variant="subtle" component={Link} to="/orders">
                      My Orders
                    </Button>
                  )}
                  <Button
                    variant="light"
                    color="red"
                    onClick={handleLogout}
                    aria-label="Log out of your account"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="subtle" component={Link} to="/login">
                    Login
                  </Button>
                  <Button component={Link} to="/register">
                    Register
                  </Button>
                </>
              )}
            </Group>
          </nav>
        </Group>
      </Container>
    </header>
  );
}
