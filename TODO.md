# Order Cancellation Request Feature Implementation

## Backend Changes
- [x] Update Order model to add cancellation request fields
- [x] Modify orders route: change cancel endpoint to create cancellation request
- [x] Add admin routes for accepting/rejecting cancellation requests
- [x] Update admin controller to handle cancellation request approval/rejection

## Frontend Changes
- [x] Update OrdersPage: change cancel button to send cancellation request
- [x] Update OrdersPage: show cancellation request status
- [ ] Update AdminDashboard: add UI for viewing cancellation requests
- [ ] Update AdminDashboard: add approve/reject buttons for cancellation requests

## Testing
- [ ] Test user cancellation request flow
- [ ] Test admin approval/rejection flow
- [ ] Test edge cases (multiple requests, status updates)
