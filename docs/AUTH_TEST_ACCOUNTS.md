# Local Test / QA Accounts

> [!WARNING]
> **DEVELOPMENT / QA ONLY**
>
> The credentials listed below are generated automatically by the development seeding scripts (`npm run seed`). DO NOT use these credentials in a staging or production environment.

---

The database seed command generates the following testing profiles:

| Account Type | Email | Password | Role | Wallet Balance |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@be11.com` | `SuperAdmin@123` | `SUPER_ADMIN` | `₹0.00` |
| **Admin** | `admin@be11.com` | `Admin@123` | `ADMIN` | `₹0.00` |
| **Player** | `player@be11.com` | `Player@123` | `PLAYER` | `₹30,000.00` |
| **Coach** | `coach@be11.com` | `Coach@123` | `COACH` | `₹0.00` |
| **Venue Owner** | `groundowner@be11.com` | `Ground@123` | `OWNER` | `₹0.00` |
| **Vendor** | `vendor@be11.com` | `Vendor@123` | `VENDOR` | `₹0.00` |
| **Store Manager**| `store@be11.com` | `Store@123` | `STORE_MANAGER` | `₹0.00` |
| **Support** | `support@be11.com` | `Support@123` | `SUPPORT` | `₹0.00` |

---

## Seeding new DB
To wipe the SQLite DB and seed these development credentials, run:
```bash
npm run seed --workspace=backend
```
