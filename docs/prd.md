Requirements Document
1. Application Overview
1.1 Application Name
Chef's Kitchen

1.2 Application Description
A Progressive Web App for a fast-food restaurant based in Navrongo, Ghana that enables customers to browse menu, place orders (pickup/delivery/curbside), track order status in real-time, and pre-order for future dates. The system includes Paystack payment integration for Mobile Money and card payments, push notifications via Firebase Cloud Messaging, staff interfaces for kitchen operations, menu management, order management, and restaurant settings configuration.

2. Users and Usage Scenarios
2.1 Target Users
Customers: Individuals ordering food for pickup, delivery, or curbside collection
Kitchen Workers: Staff preparing orders and updating order status
Managers: Staff managing menu, orders, workers, and restaurant settings
Administrators: Super users with full system access including manager creation
2.2 Core Usage Scenarios
Customer browses menu and places immediate or scheduled orders
Customer pays online using Mobile Money or card via Paystack
Customer receives push notifications when order status changes
Customer tracks order preparation status in real-time
Kitchen worker views incoming orders and updates preparation progress
Manager adjusts menu availability, manages staff, and configures restaurant operations
Customer pre-orders for future dates when restaurant is closed
3. Page Structure and Functionality
3.1 Page Hierarchy
Root
├── Login/Sign-up Page
├── Customer Section
│   ├── Home Page
│   ├── Menu Item Detail Page
│   ├── Cart Page
│   ├── Checkout Page
│   ├── Payment Success Page
│   ├── Order Tracking Page
│   ├── Order History Page
│   ├── Location Page
│   ├── Pre-order Page
│   └── Profile Page
├── Worker Section
│   └── Kitchen Display Page
├── Manager Section
│   ├── Dashboard Page
│   ├── Menu Manager Page
│   ├── Orders Manager Page
│   ├── Staff Manager Page
│   └── Settings Page
└── Admin Section
    └── Admin Dashboard Page (includes all Manager features plus manager creation)
3.2 Authentication Pages
3.2.1 Login/Sign-up Page
Single unified login screen for all user types
Sign-up Flow:
Input fields: name, email, password
Submit creates user account with role set to customer in profiles table
Login Flow:
Input fields: email, password
After successful login, system reads user role from profiles table
Routes user to appropriate interface based on role (customer/worker/manager/admin)
Register FCM service worker and request notification permission
Store FCM token in fcm_tokens table
Forgot Password:
Link to password reset flow
User enters email to receive reset instructions
3.3 Customer Section
3.3.1 Home Page
Dynamic Status Banner:
If restaurant is open: Display "We're cooking! Order now" message with menu access
If restaurant is closed for the day: Display "Chef's Kitchen is closed for today – thank you!" with custom message from settings and "Pre-order for tomorrow" button
If closedTemporarily flag is true: Display same closed message as above
Menu Display:
Show menu items filtered by available == true and stock > 0
Real-time updates when availability or stock changes
Bottom Navigation: Menu, Cart, Orders, Location, Profile
Cart Badge: Display item count on cart icon
3.3.2 Menu Item Detail Page
Display large item image, name, description, price
Show dietary tags as icons
Customization Options:
List available customizations with upcharge prices
User selects desired modifications
Add to Cart Button: Saves item with selected customizations to cart
3.3.3 Cart Page
List all cart items with name, customizations, quantity, price
Display subtotal, tax, total
Edit quantity or remove items
Proceed to checkout button
Cart data persists in localStorage and syncs with backend when user is logged in
3.3.4 Checkout Page
Order Type Selection: Pickup, Delivery, or Curbside/Drive-thru
Date Selection:
"Today" option if restaurant is currently open
Future dates up to maxPreOrderDays (only open days)
Time Slot Selection:
For Pickup/Curbside: Choose 15-minute interval time slots
"ASAP" option if restaurant is open and slots available
System validates slot capacity before allowing selection
Delivery Address (if Delivery selected):
Input address fields
Calculate delivery fee based on radius from restaurant
Special Instructions: Text field for customer notes
Tip Selection: Predefined percentage options plus custom amount input
Payment Method Selection:
"Pay at Pickup/Delivery" option
"Pay with Mobile Money / Card" button
Place Order Button:
Validates time slot capacity
If slot full, display error message
If "Pay at Pickup/Delivery" selected, creates order and navigates to Order Tracking Page
If "Pay with Mobile Money / Card" selected, calls create-paystack-charge edge function with order details and total amount in pesewas (GHS multiplied by 100), receives authorization_url, redirects user to Paystack hosted payment page in new tab
3.3.5 Payment Success Page
Reads reference parameter from URL query string
Calls verify-paystack-payment edge function with reference
Displays payment confirmation message
Shows order number and total amount
Link to Order Tracking Page
3.3.6 Order Tracking Page
Display order number and customer name
Status Tracker: Visual progress indicator showing Confirmed → Preparing → Ready → Completed
Real-time status updates via live data connection
Display kitchen notes as chat bubbles when workers add replies
Show order items with customizations
Display estimated completion time
3.3.7 Order History Page
List all past orders with date, items, total, status
Re-order Button: Adds previous order items to cart
Favorites Star: Mark frequently ordered items
3.3.8 Location Page
Display restaurant address
Show parking tips and location information
Get Directions Button: Opens device maps application with restaurant location
3.3.9 Pre-order Page
Accessible when restaurant is closed
Date Selection: Choose from future open days (up to maxPreOrderDays)
After date selection, display menu with available items
Same checkout flow as regular orders with scheduled time
3.3.10 Profile Page
Display user name, email, phone
Manage saved addresses
Logout button
3.4 Worker Section
3.4.1 Kitchen Display Page
Full-screen kanban board optimized for tablet viewing
Columns: New Orders, In Progress, Ready, Completed
Order Cards display:
Order number
Customer name
List of items with modifications
Order type (Pickup/Delivery/Curbside)
Elapsed time since order placed (timer)
Timer turns red if exceeds configurable threshold (e.g., 8 minutes)
Actions per Order:
"Accept" button: Moves order to In Progress column, triggers send-order-notification edge function
"Add Note" button: Opens input to save kitchenNote
"Ready" button: Moves order to Ready column, triggers send-order-notification edge function
Sound alert when new order arrives
Real-time synchronization across multiple worker devices
3.5 Manager Section
3.5.1 Dashboard Page
Today's Statistics:
Total orders count
Total revenue
Popular items list
Real-time Order Feed: Quick view of recent orders
3.5.2 Menu Manager Page
Menu Items Table displaying:
Image thumbnail
Name
Price
Category
Availability toggle
Stock remaining
Edit Item:
Modal to edit all item fields (name, description, price, category, dietary tags, available status, stock, customizations)
Upload image to storage
Add New Item: Form to create new menu item
Bulk Actions: "Mark as Sold Out" for multiple items
Combo Builder:
Create combo meal by selecting existing items
Set discounted combo price
Save combo as new menu item with isCombo flag
3.5.3 Orders Manager Page
List all orders with filters:
Filter by status (new/accepted/preparing/ready/completed/cancelled)
Search by customer name or order number
Default view shows today's active orders
Order Actions:
View order details
Cancel order
Mark as completed
3.5.4 Staff Manager Page
Staff Table displaying:
Name
Email
Role (worker/manager)
Status (active/disabled)
Add Worker:
Form with email, temporary password, role selection
System creates account and sends password reset email
Manager can only create worker role
Staff Actions:
Disable/enable staff member
Delete staff member
3.5.5 Settings Page
Opening Hours Configuration:
Set hours for each day of week
Time picker inputs for open and close times
Temporary Closure:
"Close Kitchen for Today" button
Sets closedTemporarily flag to true
Custom Closed Message: Text input for message displayed when closed
Pre-order Settings:
Maximum pre-order days (maxPreOrderDays)
Maximum orders per time slot (maxOrdersPerSlot)
Delivery Settings:
Delivery radius in kilometers
Delivery fee amount
Enable/disable delivery option
Preparation Time: Estimated minutes for order preparation
3.6 Admin Section
3.6.1 Admin Dashboard Page
Includes all Manager Section features
Additional Capabilities:
Create manager role accounts in Staff Manager
Access to system-level settings
Ability to disable/enable any staff including managers
4. Business Rules and Logic
4.1 User Role and Access Control
System supports four roles: customer, worker, manager, admin
Admin role is seeded in database (no sign-up available)
After login, system reads role from profiles table and routes accordingly:
customer → Customer Section
worker → Worker Section (Kitchen Display only)
manager → Manager Section
admin → Admin Section
Managers can create worker accounts only
Admins can create both worker and manager accounts
4.2 Restaurant Availability Logic
Restaurant availability determined by:
Current time within opening hours for current day
closedTemporarily flag is false
If closed, customers can only access pre-order flow
Menu items only display if:
available field is true
stock > 0 (or limitedStock is null for unlimited items)
4.3 Order Time Slot Management
Time slots generated in 15-minute intervals during opening hours
Each slot has capacity limit defined by maxOrdersPerSlot
Before order placement, system validates selected slot has available capacity
If slot full, prevent order and display error
"ASAP" option available only if restaurant currently open and slots available
4.4 Pre-order Date Restrictions
Customers can pre-order up to maxPreOrderDays in advance
Only dates when restaurant is open are selectable
System calculates available dates based on opening hours configuration
4.5 Delivery Radius Validation
When customer selects delivery, system calculates distance from restaurant
If address exceeds deliveryRadiusKm, prevent order and display error
Delivery fee applied based on settings
4.6 Menu Stock Management
Items with limitedStock field set have finite quantity
remaining field decrements when item ordered
When remaining reaches 0, item automatically becomes unavailable
Items with limitedStock == null have unlimited stock
4.7 Order Status Workflow
Order progresses through states: new → accepted → preparing → ready → completed
Workers can add kitchenNote at any stage
Status updates trigger real-time notifications to customer
Cancelled orders do not progress through workflow
4.8 Combo Meal Logic
Combo items have isCombo flag set to true
comboItems field stores array of included item IDs
Combo price is typically discounted compared to individual item sum
When combo added to cart, system stores as single item with combo details
4.9 Cart Persistence
Cart data stored in localStorage for offline access
When user logs in, cart syncs with backend
Cart persists across sessions until checkout or manual clear
4.10 Real-time Data Synchronization
Menu availability updates propagate to all customer devices immediately
Order status changes update customer tracking page in real-time
Kitchen display updates across all worker devices simultaneously
Manager changes to settings take effect immediately
4.11 Paystack Payment Processing
All payment amounts must be in pesewas (GHS multiplied by 100)
Currency set to GHS for all Paystack transactions
Payment Flow:
create-paystack-charge edge function initializes Paystack transaction using Initialize Transaction API
Function returns authorization_url
User redirected to Paystack hosted payment page in new tab
After payment completion, Paystack redirects to Payment Success Page with reference parameter
verify-paystack-payment edge function calls Verify Transaction API with reference
Function confirms payment status and updates order status in database
Paystack secret key stored as PAYSTACK_SECRET_KEY environment variable
4.12 Push Notification System
FCM service worker registered on user login
System requests notification permission from user
FCM token stored in fcm_tokens table linked to user_id
Notification Triggers:
Order status changes from new to accepted: "Your order is being prepared"
Order status changes to ready: "Your order is ready for pickup"
send-order-notification edge function accepts order_id and new_status parameters
Function retrieves customer FCM token from fcm_tokens table
Function sends push notification via FCM HTTP v1 API
FCM server key stored as FCM_SERVER_KEY environment variable
5. Exceptions and Edge Cases
Scenario	Handling
User attempts to order when restaurant closed	Display closed message, redirect to pre-order flow
Selected time slot becomes full during checkout	Display error, prompt to select different slot
Menu item becomes unavailable while in cart	Remove item from cart, notify user
Delivery address outside radius	Display error, suggest pickup option
Network connection lost	Display offline banner, queue actions for sync when reconnected
Worker device loses connection	Display warning, continue showing cached orders, sync when reconnected
Multiple workers accept same order	System prevents duplicate acceptance, only first action succeeds
Customer cancels order after worker started preparing	Order marked cancelled, worker notified to stop
Stock depletes to zero during checkout	Prevent order, notify user item unavailable
User forgets password	Send password reset email with secure link
Staff account disabled mid-session	Force logout on next action, display account disabled message
Order exceeds preparation time threshold	Timer turns red on kitchen display, alert sound
Image upload fails	Display error, allow retry or skip image
Invalid email format during sign-up	Display validation error, prevent submission
Duplicate email during sign-up	Display error that email already exists
Paystack payment fails	Display error message, allow user to retry payment or choose different payment method
Paystack API timeout	Display error, prompt user to check payment status on Payment Success Page
Invalid reference parameter on Payment Success Page	Display error message, provide link to Order History
FCM token registration fails	Log error, allow user to continue without notifications
Push notification delivery fails	System logs failure, does not block order workflow
User denies notification permission	System continues normal operation without push notifications
6. Acceptance Criteria
Customer creates account, logs in, grants notification permission, and is routed to Customer Home Page
Customer browses menu, selects item with customizations, adds to cart
Customer proceeds to checkout, selects order type (Pickup), chooses time slot, adds tip, selects "Pay with Mobile Money / Card"
System calls create-paystack-charge edge function, redirects customer to Paystack hosted payment page
Customer completes payment using Mobile Money, Paystack redirects to Payment Success Page with reference
System calls verify-paystack-payment edge function, confirms payment, displays confirmation
Order appears on Kitchen Display Page in New Orders column with sound alert
Worker accepts order (moves to In Progress), system sends push notification to customer
Worker marks order as Ready, system sends push notification to customer
Customer receives push notifications and sees real-time status updates on Order Tracking Page
7. Out of Scope for This Release
Customer loyalty program or rewards points
Customer reviews and ratings for menu items
Multi-language support
Nutritional information display
Allergen filtering and warnings
Order modification after placement
Split payment between multiple customers
Gift cards or promotional codes
Customer chat support
Inventory management beyond stock tracking
Supplier ordering and management
Financial reporting and analytics
Employee scheduling and time tracking
Customer feedback surveys
Integration with third-party delivery services
Table reservation system
Catering orders for large groups
Subscription meal plans
Refund processing
Recurring payment subscriptions
8. Technical Implementation Requirements
8.1 Supabase Edge Functions
8.1.1 create-paystack-charge
Accepts order details and total amount as parameters
Converts amount to pesewas (multiply GHS by 100)
Calls Paystack Initialize Transaction API
Returns authorization_url for redirect
8.1.2 verify-paystack-payment
Accepts reference parameter
Calls Paystack Verify Transaction API
Confirms payment status
Updates order status in orders table
Returns verification result
8.1.3 send-order-notification
Accepts order_id and new_status parameters
Retrieves customer user_id from orders table
Retrieves FCM token from fcm_tokens table
Sends push notification via FCM HTTP v1 API
Returns success/failure status
8.2 Environment Configuration
8.2.1 Required Environment Variables
VITE_SUPABASE_URL: Supabase project URL
VITE_SUPABASE_ANON_KEY: Supabase anonymous key
PAYSTACK_SECRET_KEY: Paystack secret key from dashboard.paystack.com
FCM_SERVER_KEY: Firebase Cloud Messaging server key
8.2.2 Environment Setup
Create .env.example file listing all required variables
Document setup steps in README.md
8.3 Production Build
Run npm run build to generate production bundle
Fix all TypeScript compilation errors
Fix all build warnings
8.4 Documentation
8.4.1 README.md Contents
Project overview and features
Local development setup instructions
Supabase project setup steps
Environment variable configuration guide
Paystack setup instructions (obtain keys from dashboard.paystack.com)
Firebase Cloud Messaging setup instructions
Deployment steps for Vercel/Netlify
Troubleshooting common issues
Database Schema Reference
profiles table
id (references auth.users)
email
name
role (customer/worker/manager/admin)
disabled
phone
addresses (JSON)
createdAt
fcm_tokens table
id
user_id (references profiles.id)
token
created_at
menu_items table
id
name
description
imageUrl
price
category
dietaryTags (array)
available
limitedStock
remaining
isCombo
comboItems (JSON)
customizations (JSON)
orders table
id
userId
items (JSON)
subtotal
tax
deliveryFee
tip
total
type (pickup/delivery/curbside)
status (new/accepted/preparing/ready/completed/cancelled)
scheduledTime
customerNote
kitchenNote
deliveryAddress (JSON)
curbsideVehicle
paymentMethod (cash/paystack)
paystackReference
createdAt
restaurant_settings table
openingHours (JSON)
timezone
closedTemporarily
customClosedMessage
maxPreOrderDays
maxOrdersPerSlot
deliveryEnabled
deliveryRadiusKm
deliveryFee
prepTimeEstimateMinutes