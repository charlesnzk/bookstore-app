from decouple import config
from django.db import transaction
from django.db.models import Sum, F
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, Order, OrderBook, User
from .permissions import IsAdminUser
from .serializers import (
    BookSerializer,
    CreateOrderSerializer,
    OrderSerializer,
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
        instance = serializer.save()
        if instance.stock == 0:
            instance.availability = False
            instance.save()
        elif instance.stock > 0 and not instance.availability:
            pass

    def perform_destroy(self, instance):
        instance.soft_delete()


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "items__book"
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


class CancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.status != "pending":
            return Response(
                {"error": "Only pending orders can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            order.status = "cancelled"
            order.save()
            for item in order.items.all():
                book = Book.objects.select_for_update().get(pk=item.book.pk)
                book.stock += item.quantity
                if book.stock > 0:
                    book.availability = True
                book.save()

        return Response(OrderSerializer(order).data)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Order.objects.all().prefetch_related("items__book")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminOrderUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")
        if not new_status:
            return Response(
                {"error": "Status is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Choose from: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status == "cancelled":
            return Response(
                {"error": "Cannot update a cancelled order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            if new_status == "cancelled" and order.status != "cancelled":
                for item in order.items.all():
                    book = Book.objects.select_for_update().get(pk=item.book.pk)
                    book.stock += item.quantity
                    if book.stock > 0:
                        book.availability = True
                    book.save()

            order.status = new_status
            order.save()

        return Response(OrderSerializer(order).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        total_orders = Order.objects.count()
        total_books = Book.objects.filter(is_deleted=False).count()
        total_customers = User.objects.filter(is_admin=False).count()
        low_stock_books = Book.objects.filter(
            is_deleted=False, stock__lte=3, availability=True
        ).count()
        out_of_stock_books = Book.objects.filter(
            is_deleted=False, availability=False
        ).count()
        total_revenue = (
            OrderBook.objects.filter(order__status="delivered").aggregate(
                revenue=Sum(F("price_at_purchase") * F("quantity"))
            )["revenue"]
            or 0
        )
        orders_by_status = {}
        for choice in Order.STATUS_CHOICES:
            orders_by_status[choice[0]] = Order.objects.filter(status=choice[0]).count()

        orders_by_delivery = {}
        for choice in Order.DELIVERY_CHOICES:
            orders_by_delivery[choice[0]] = Order.objects.filter(
                delivery_method=choice[0]
            ).count()

        return Response(
            {
                "total_orders": total_orders,
                "total_books": total_books,
                "total_customers": total_customers,
                "low_stock_books": low_stock_books,
                "out_of_stock_books": out_of_stock_books,
                "total_revenue": float(total_revenue),
                "orders_by_status": orders_by_status,
                "orders_by_delivery": orders_by_delivery,
            }
        )


class ChatbotView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return Response(
                {"error": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        system_prompt = """You are a customer support assistant for an online \
            bookstore. Answer questions about the following topics only:

            Delivery options:
            - Standard: 3-5 business days
            - Express: 1-2 business days
            - Self pickup: same day

            Supported countries: Singapore, Malaysia, Indonesia, Thailand, Philippines.

            Order statuses:
            - Pending: order received, not yet processed
            - Confirmed: being processed
            - Shipped: on the way
            - Delivered: received by customer

            Cancellations: customers can cancel pending orders only. Once confirmed, \
            cancellation is not possible.

            Returns: not supported at this time.

            Payment: major credit and debit cards accepted.

            Keep replies short and friendly. If the question is unrelated to the \
            bookstore, say you can only help with bookstore queries."""

        try:
            llm = ChatOpenAI(
                model="gpt-3.5-turbo",
                temperature=0.7,
                api_key=config("OPENAI_API_KEY", default=""),
            )
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=message),
            ]
            response = llm.invoke(messages)
            return Response({"reply": response.content})

        except Exception:
            return Response(
                {"error": "Chatbot unavailable. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
