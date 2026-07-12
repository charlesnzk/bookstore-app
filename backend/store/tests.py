from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Book, Order, OrderBook, User


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_success(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "testuser",
                "email": "test@test.com",
                "password": "TestPass123!",
                "password2": "TestPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="testuser").exists())

    def test_register_password_mismatch(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "testuser",
                "email": "test@test.com",
                "password": "TestPass123!",
                "password2": "WrongPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_register_weak_password(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "testuser",
                "email": "test@test.com",
                "password": "123",
                "password2": "123",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        User.objects.create_user(username="testuser", password="TestPass123!")
        response = self.client.post(
            "/api/register/",
            {
                "username": "testuser",
                "email": "other@test.com",
                "password": "TestPass123!",
                "password2": "TestPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        User.objects.create_user(username="testuser", password="TestPass123!")
        response = self.client.post(
            "/api/token/",
            {"username": "testuser", "password": "TestPass123!"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        User.objects.create_user(username="testuser", password="TestPass123!")
        response = self.client.post(
            "/api/token/",
            {"username": "testuser", "password": "WrongPass!"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_requires_auth(self):
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_returns_user_data(self):
        user = User.objects.create_user(
            username="testuser", password="TestPass123!"
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")
        self.assertNotIn("password", response.data)


class BookTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin", password="AdminPass123!", is_admin=True
        )
        self.customer = User.objects.create_user(
            username="customer", password="CustPass123!"
        )
        self.book = Book.objects.create(
            isbn="9781234567890",
            title="Test Book",
            description="A test book",
            price=Decimal("9.99"),
            stock=10,
            availability=True,
        )

    def test_anyone_can_list_books(self):
        response = self.client.get("/api/books/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_books_excludes_deleted(self):
        self.book.soft_delete()
        response = self.client.get("/api/books/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_search_books_by_title(self):
        response = self.client.get("/api/books/?search=Test")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_search_books_no_results(self):
        response = self.client.get("/api/books/?search=nonexistent")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_get_book_detail(self):
        response = self.client.get(f"/api/books/{self.book.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Test Book")

    def test_get_deleted_book_returns_404(self):
        self.book.soft_delete()
        response = self.client.get(f"/api/books/{self.book.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_create_book(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/admin/books/",
            {
                "isbn": "9780000000001",
                "title": "New Book",
                "description": "desc",
                "price": "14.99",
                "stock": 5,
                "availability": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Book.objects.filter(isbn="9780000000001").exists())

    def test_admin_create_book_invalid_isbn(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/admin/books/",
            {
                "isbn": "INVALIDISBN",
                "title": "Bad Book",
                "price": "9.99",
                "stock": 5,
                "availability": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_create_book_invalid_price(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/admin/books/",
            {
                "isbn": "9780000000002",
                "title": "Bad Price Book",
                "price": "-5.00",
                "stock": 5,
                "availability": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_customer_cannot_create_book(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            "/api/admin/books/",
            {
                "isbn": "9780000000002",
                "title": "Another Book",
                "price": "9.99",
                "stock": 5,
                "availability": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_book(self):
        response = self.client.post(
            "/api/admin/books/",
            {
                "isbn": "9780000000003",
                "title": "Another Book",
                "price": "9.99",
                "stock": 5,
                "availability": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_update_book(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/admin/books/{self.book.id}/",
            {"title": "Updated Title", "price": "19.99"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.book.refresh_from_db()
        self.assertEqual(self.book.title, "Updated Title")

    def test_admin_soft_delete_book(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/admin/books/{self.book.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.book.refresh_from_db()
        self.assertTrue(self.book.is_deleted)
        self.assertFalse(self.book.availability)

    def test_soft_deleted_book_not_in_catalogue(self):
        self.client.force_authenticate(user=self.admin)
        self.client.delete(f"/api/admin/books/{self.book.id}/")
        response = self.client.get("/api/books/")
        self.assertEqual(response.data["count"], 0)


class OrderTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin", password="AdminPass123!", is_admin=True
        )
        self.customer = User.objects.create_user(
            username="customer", password="CustPass123!"
        )
        self.other_customer = User.objects.create_user(
            username="other", password="OtherPass123!"
        )
        self.book = Book.objects.create(
            isbn="9781234567890",
            title="Test Book",
            price=Decimal("9.99"),
            stock=5,
            availability=True,
        )
        self.client.force_authenticate(user=self.customer)

    def test_create_order_success(self):
        response = self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 2}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        self.book.refresh_from_db()
        self.assertEqual(self.book.stock, 3)

    def test_order_snapshots_price(self):
        response = self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_item = OrderBook.objects.first()
        self.assertEqual(order_item.price_at_purchase, Decimal("9.99"))

    def test_order_sets_unavailable_when_stock_zero(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 5}],
            },
            format="json",
        )
        self.book.refresh_from_db()
        self.assertEqual(self.book.stock, 0)
        self.assertFalse(self.book.availability)

    def test_order_fails_insufficient_stock(self):
        response = self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 99}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_order_fails_unavailable_book(self):
        self.book.availability = False
        self.book.save()
        response = self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_fails_nonexistent_book(self):
        response = self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": 9999, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_fails_invalid_delivery_method(self):
        response = self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "teleport",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_fails_empty_items(self):
        response = self.client.post(
            "/api/orders/create/",
            {"delivery_method": "standard", "items": []},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_cannot_create_order(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_sees_only_own_orders(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.client.force_authenticate(user=self.other_customer)
        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_admin_can_see_all_orders(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/orders/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_admin_can_filter_orders_by_status(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/orders/?status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_admin_can_update_order_status(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        order = Order.objects.first()
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/admin/orders/{order.id}/",
            {"status": "confirmed"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, "confirmed")

    def test_customer_cannot_access_admin_orders(self):
        response = self.client.get("/api/admin/orders/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_can_cancel_pending_order(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        order = Order.objects.first()
        response = self.client.post(f"/api/orders/{order.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, "cancelled")
        self.book.refresh_from_db()
        self.assertEqual(self.book.stock, 5)

    def test_customer_cannot_cancel_confirmed_order(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        order = Order.objects.first()
        order.status = "confirmed"
        order.save()
        response = self.client.post(f"/api/orders/{order.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cancel_restores_stock(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 2}],
            },
            format="json",
        )
        order = Order.objects.first()
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/admin/orders/{order.id}/",
            {"status": "cancelled"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, "cancelled")
        self.book.refresh_from_db()
        self.assertEqual(self.book.stock, 5)

    def test_admin_cannot_update_cancelled_order(self):
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        order = Order.objects.first()
        order.status = "cancelled"
        order.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/admin/orders/{order.id}/",
            {"status": "confirmed"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminStatsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin", password="AdminPass123!", is_admin=True
        )
        self.customer = User.objects.create_user(
            username="customer", password="CustPass123!"
        )
        self.book = Book.objects.create(
            isbn="9781234567890",
            title="Test Book",
            price=Decimal("9.99"),
            stock=10,
            availability=True,
        )

    def test_admin_can_view_stats(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_orders", response.data)
        self.assertIn("total_books", response.data)
        self.assertIn("orders_by_status", response.data)

    def test_stats_reflect_correct_counts(self):
        self.client.force_authenticate(user=self.customer)
        self.client.post(
            "/api/orders/create/",
            {
                "delivery_method": "standard",
                "items": [{"book_id": self.book.id, "quantity": 1}],
            },
            format="json",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.data["total_orders"], 1)
        self.assertEqual(response.data["total_books"], 1)
        self.assertEqual(response.data["orders_by_status"]["pending"], 1)

    def test_customer_cannot_view_stats(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_view_stats(self):
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
