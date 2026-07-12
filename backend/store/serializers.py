from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Book, Order, OrderBook, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_admin"]


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            "id",
            "isbn",
            "title",
            "description",
            "price",
            "stock",
            "availability",
            "created_at",
            "updated_at",
        ]

    def validate_isbn(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("ISBN must contain only digits.")
        if len(value) not in [10, 13]:
            raise serializers.ValidationError("ISBN must be 10 or 13 digits.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value


class OrderBookSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_isbn = serializers.CharField(source="book.isbn", read_only=True)

    class Meta:
        model = OrderBook
        fields = [
            "id",
            "book",
            "book_title",
            "book_isbn",
            "quantity",
            "price_at_purchase",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderBookSerializer(many=True, read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "username",
            "delivery_method",
            "status",
            "date_submitted",
            "date_updated",
            "items",
        ]


class CreateOrderSerializer(serializers.Serializer):
    delivery_method = serializers.ChoiceField(choices=Order.DELIVERY_CHOICES)
    items = serializers.ListField(child=serializers.DictField(), min_length=1)

    def validate_items(self, items):
        errors = []
        for i, item in enumerate(items):
            if "book_id" not in item:
                errors.append(f"Item {i + 1} is missing book_id.")
            if "quantity" not in item:
                errors.append(f"Item {i + 1} is missing quantity.")
            elif int(item["quantity"]) < 1:
                errors.append(f"Item {i + 1} quantity must be at least 1.")
        if errors:
            raise serializers.ValidationError(errors)
        return items


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]
