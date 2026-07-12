from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, Order, OrderBook, User
from .permissions import IsAdminUser
from .serializers import (
    BookSerializer,
    CreateOrderSerializer,
    OrderSerializer,
    OrderStatusSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class BookListView(generics.ListAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Book.objects.filter(is_deleted=False)
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)
        return queryset


class BookDetailView(generics.RetrieveAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Book.objects.filter(is_deleted=False)


class AdminBookListView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Book.objects.filter(is_deleted=False)

    def perform_create(self, serializer):
        serializer.save()


class AdminBookDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsAdminUser]
    queryset = Book.objects.filter(is_deleted=False)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.soft_delete()


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__book")
        )


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        items = serializer.validated_data["items"]
        delivery_method = serializer.validated_data["delivery_method"]

        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=request.user,
                    delivery_method=delivery_method,
                )
                for item in items:
                    book = Book.objects.select_for_update().get(
                        id=item["book_id"], is_deleted=False
                    )
                    quantity = int(item["quantity"])

                    if not book.availability:
                        raise ValueError(f'"{book.title}" is not available.')
                    if book.stock < quantity:
                        raise ValueError(
                            f'Not enough stock for "{book.title}". '
                            f"Only {book.stock} left."
                        )

                    book.stock -= quantity
                    if book.stock == 0:
                        book.availability = False
                    book.save()

                    OrderBook.objects.create(
                        order=order,
                        book=book,
                        quantity=quantity,
                        price_at_purchase=book.price,
                    )

        except Book.DoesNotExist:
            return Response(
                {"error": "One or more books not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Order.objects.all().prefetch_related("items__book")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminOrderUpdateView(generics.UpdateAPIView):
    serializer_class = OrderStatusSerializer
    permission_classes = [IsAdminUser]
    queryset = Order.objects.all()


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_orders = Order.objects.count()
        total_books = Book.objects.filter(is_deleted=False).count()
        orders_by_status = {}
        for choice in Order.STATUS_CHOICES:
            orders_by_status[choice[0]] = Order.objects.filter(
                status=choice[0]
            ).count()

        return Response(
            {
                "total_orders": total_orders,
                "total_books": total_books,
                "orders_by_status": orders_by_status,
            }
        )
