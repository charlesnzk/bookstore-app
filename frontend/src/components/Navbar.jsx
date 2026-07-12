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
    <div style={{ borderBottom: "1px solid #eee", marginBottom: "1rem" }}>
      <Container size="xl" py="sm">
        <Group justify="space-between">
          <Text fw={700} size="lg" component={Link} to="/" style={{ textDecoration: "none" }}>
            Bookstore
          </Text>
          <Group>
            {user ? (
              <>
                <Button variant="subtle" component={Link} to="/">
                  Books
                </Button>
                {user.is_admin ? (
                  <>
                    <Button variant="subtle" component={Link} to="/admin/books">
                      Manage Books
                    </Button>
                    <Button variant="subtle" component={Link} to="/admin/orders">
                      Manage Orders
                    </Button>
                    <Button variant="subtle" component={Link} to="/admin/stats">
                      Stats
                    </Button>
                  </>
                ) : (
                  <Button variant="subtle" component={Link} to="/orders">
                    My Orders
                  </Button>
                )}
                <Button variant="light" color="red" onClick={handleLogout}>
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
        </Group>
      </Container>
    </div>
  );
}
