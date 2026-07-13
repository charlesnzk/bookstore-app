from django.core.management.base import BaseCommand
from store.models import User, Book


class Command(BaseCommand):
    help = "Seed the database with sample data"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database...")

        Book.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        User.objects.filter(username="admin").delete()

        admin = User.objects.create_user(
            username="admin",
            email="admin@bookstore.com",
            password="Admin!123",
            is_admin=True,
            is_staff=True,
            is_superuser=True,
        )
        self.stdout.write(f"  Created admin: {admin.username}")

        for i in range(1, 4):
            customer = User.objects.create_user(
                username=f"customer{i}",
                email=f"customer{i}@bookstore.com",
                password="Customer!123",
            )
            self.stdout.write(f"  Created customer: {customer.username}")

        books_data = [
            {
                "isbn": "9781234567001",
                "title": "Introduction to Python",
                "description": "A beginner-friendly guide to Python programming.",
                "price": "29.99",
                "stock": 20,
                "availability": True,
            },
            {
                "isbn": "9781234567002",
                "title": "Web Development Basics",
                "description": "Covers HTML, CSS and JavaScript fundamentals.",
                "price": "24.99",
                "stock": 15,
                "availability": True,
            },
            {
                "isbn": "9781234567003",
                "title": "Data Structures and Algorithms",
                "description": "Core concepts for software engineering interviews.",
                "price": "34.99",
                "stock": 10,
                "availability": True,
            },
            {
                "isbn": "9781234567004",
                "title": "Django for Beginners",
                "description": "Build web apps with Django from scratch.",
                "price": "27.99",
                "stock": 3,
                "availability": True,
            },
            {
                "isbn": "9781234567005",
                "title": "React in Practice",
                "description": "Hands-on guide to building UIs with React.",
                "price": "26.99",
                "stock": 8,
                "availability": True,
            },
            {
                "isbn": "9781234567006",
                "title": "SQL for Everyone",
                "description": "Learn SQL from the basics to advanced queries.",
                "price": "22.99",
                "stock": 0,
                "availability": False,
            },
            {
                "isbn": "9781234567007",
                "title": "Clean Code",
                "description": "Writing readable and maintainable software.",
                "price": "31.99",
                "stock": 12,
                "availability": True,
            },
            {
                "isbn": "9781234567008",
                "title": "Docker and Containers",
                "description": "Practical guide to containerising applications.",
                "price": "28.99",
                "stock": 5,
                "availability": True,
            },
        ]

        for data in books_data:
            book = Book.objects.create(**data)
            self.stdout.write(f"  Created book: {book.title}")

        self.stdout.write(self.style.SUCCESS("\nDone. Login credentials:"))
        self.stdout.write("  Admin:    admin / Admin!123")
        self.stdout.write("  Customer: customer1 / Customer!123")
