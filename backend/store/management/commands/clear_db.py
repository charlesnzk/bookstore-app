from django.core.management.base import BaseCommand
from store.models import User, Book, Order, OrderBook


class Command(BaseCommand):
    help = "Clear all application data from the database"

    def handle(self, *args, **kwargs):
        OrderBook.objects.all().delete()
        Order.objects.all().delete()
        Book.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.SUCCESS("Database cleared."))
