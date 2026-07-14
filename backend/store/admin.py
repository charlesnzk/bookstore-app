from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Book, Order, OrderBook, User


class BookAdminForm(forms.ModelForm):
    class Meta:
        model = Book
        fields = "__all__"

    def clean_isbn(self):
        isbn = self.cleaned_data.get("isbn", "")
        if not isbn.isdigit():
            raise forms.ValidationError("ISBN must contain only digits.")
        if len(isbn) not in [10, 13]:
            raise forms.ValidationError("ISBN must be 10 or 13 digits.")
        return isbn


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "is_admin", "is_staff"]
    fieldsets = UserAdmin.fieldsets + (("Role", {"fields": ("is_admin",)}),)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    form = BookAdminForm
    list_display = ["title", "isbn", "price", "stock", "availability"]
    search_fields = ["title", "isbn"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "delivery_method", "date_submitted"]
    list_filter = ["status", "delivery_method"]


@admin.register(OrderBook)
class OrderBookAdmin(admin.ModelAdmin):
    list_display = ["order", "book", "quantity", "price_at_purchase"]
