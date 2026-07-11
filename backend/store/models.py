from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


class User(AbstractUser):
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class Book(models.Model):
    isbn = models.CharField(max_length=13, unique=True, db_index=True)
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    stock = models.PositiveIntegerField(default=0)
    availability = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["title", "availability"]),
        ]

    def __str__(self):
        return self.title

    def soft_delete(self):
        self.is_deleted = True
        self.availability = False
        self.save()


class Order(models.Model):
    DELIVERY_CHOICES = [
        ("standard", "Standard"),
        ("express", "Express"),
        ("pickup", "Self Pickup"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="orders",
        db_index=True,
    )
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        db_index=True,
    )
    date_submitted = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"


class OrderBook(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price_at_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )

    def __str__(self):
        return f"{self.quantity}x {self.book.title} (Order #{self.order.id})"
