================================================
BE11 SAMPLE LOGIN CREDENTIALS
DEVELOPMENT / QA ONLY
DO NOT USE IN PRODUCTION
================================================

Below is the list of test user accounts populated when database seeding is run.

---

## Seed Accounts Registry

| Account Type | Email | Password | Role | Wallet Balance |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@be11.com` | `SuperAdmin@123` | `SUPER_ADMIN` | `₹0.00` |
| **Admin** | `admin@be11.com` | `Admin@123` | `ADMIN` | `₹0.00` |
| **Player** | `player@be11.com` | `Player@123` | `PLAYER` | `₹0.00` |
| **Coach** | `coach@be11.com` | `Coach@123` | `COACH` | `₹0.00` |
| **Venue Owner** | `groundowner@be11.com` | `Ground@123` | `OWNER` | `₹0.00` |
| **Vendor** | `vendor@be11.com` | `Vendor@123` | `VENDOR` | `₹0.00` |
| **Store Manager**| `store@be11.com` | `Store@123` | `STORE_MANAGER` | `₹0.00` |
| **Support** | `support@be11.com` | `Support@123` | `SUPPORT` | `₹0.00` |

---

## Triggering DB Seed
To reset and re-seed this list of test user accounts into your local database, run:
```bash
npm run seed --workspace=backend
```
