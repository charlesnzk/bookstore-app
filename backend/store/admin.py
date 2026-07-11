from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Book, Order, OrderBook


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "is_admin", "is_staff"]
    fieldsets = UserAdmin.fieldsets + (("Role", {"fields": ("is_admin",)}),)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ["title", "isbn", "price", "stock", "availability"]
    search_fields = ["title", "isbn"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "delivery_method", "date_submitted"]
    list_filter = ["status", "delivery_method"]


@admin.register(OrderBook)
class OrderBookAdmin(admin.ModelAdmin):
    list_display = ["order", "book", "quantity", "price_at_purchase"]
