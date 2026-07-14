# User Guide

## What this is

An online bookstore. Customers can browse and buy books, while admins manage stock and process orders.

## Getting started

Go to http://localhost:5173. If you do not have an account yet, click Register. Otherwise, log in with your existing details.

## For customers

After logging in, you will see the book catalogue, divided into available books and books that are out of stock. There is a search bar at the top, and results update as you type.

To buy a book, click Buy, choose how many copies you want, and select a delivery method:

- Standard, which takes 3 to 5 business days
- Express, which takes 1 to 2 business days
- Self Pickup, which is available the same day

Click My Orders to view your order history. Clicking on an order shows its contents. Orders move through several stages, pending, confirmed, shipped and delivered. You can cancel an order yourself while it is still pending. Once it has been confirmed, you will need to wait for it to be processed. Cancelling an order restores the stock, so nothing is lost.

There is a support chat available at the bottom right of the screen for questions about delivery times, which countries are served, or how cancellations work. It isto answer common questions related to the bookstore rather than act as a general assistant.

## For admins

Admin accounts have additional tabs, including Manage Books, Manage Orders and Stats. There is no option to buy books from an admin account, as admins are not intended to place orders.

Manage Books allows you to add, edit or remove books from the catalogue. Removing a book does not delete its order history, but takes it off the catalogue. If a book's stock reaches zero, it is automatically marked as unavailable. Restocking it and editing the book again will make it available once more.

Manage Orders shows every order placed, with the option to filter by status and move each order through its stages. Cancelling an order from here restores stock in the same way as a customer cancellation would.

Stats provides a summary of the store, including total orders, books and customers, revenue from delivered orders, a breakdown by status and delivery method, and a warning if any books are running low on stock.

## What this app does not do

There is no payment processing. Orders are tracked, but no payment is actually taken. There is also no process for returns or refunds once an order has been marked as delivered. Both of these were considered not within the scope of this project.

## Delivery

Standard delivery takes 3 to 5 business days, express delivery takes 1 to 2 business days, and self pickup is available the same day. Delivery currently covers Singapore, Malaysia, Indonesia, Thailand and the Philippines.
