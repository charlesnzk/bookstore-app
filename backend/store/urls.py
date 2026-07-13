from django.urls import path

from .views import (
    AdminBookDetailView,
    AdminBookListView,
    AdminOrderListView,
    AdminOrderUpdateView,
    AdminStatsView,
    BookDetailView,
    BookListView,
    CancelOrderView,
    ChatbotView,
    CreateOrderView,
    OrderListView,
    ProfileView,
    RegisterView,
)

urlpatterns = [
    # auth
    path("register/", RegisterView.as_view()),
    path("profile/", ProfileView.as_view()),
    # books customer
    path("books/", BookListView.as_view()),
    path("books/<int:pk>/", BookDetailView.as_view()),
    # orders customer
    path("orders/", OrderListView.as_view()),
    path("orders/create/", CreateOrderView.as_view()),
    path("orders/<int:pk>/cancel/", CancelOrderView.as_view()),
    # chatbot
    path("chat/", ChatbotView.as_view()),
    # admin
    path("admin/books/", AdminBookListView.as_view()),
    path("admin/books/<int:pk>/", AdminBookDetailView.as_view()),
    path("admin/orders/", AdminOrderListView.as_view()),
    path("admin/orders/<int:pk>/", AdminOrderUpdateView.as_view()),
    path("admin/stats/", AdminStatsView.as_view()),
]
