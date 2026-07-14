import { Title, Text, Button, Center, Stack } from "@mantine/core";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main>
      <Center h={400}>
        <Stack align="center">
          <Title order={1}>404</Title>
          <Text c="dimmed">Page not found.</Text>
          <Button component={Link} to="/" variant="light">
            Back to home
          </Button>
        </Stack>
      </Center>
    </main>
  );
}
