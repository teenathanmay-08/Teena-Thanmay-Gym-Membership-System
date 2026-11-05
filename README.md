<<<<<<< HEAD
# TEENA THANMAY FITNESS — Gym Membership Management System

FSD-2 project built using HTML5, CSS3, JavaScript, Node.js, Express.js and MySQL.

## Requirements
- Node.js 18+ and npm
- MySQL Server 8+ (or compatible)

## 1. Set up MySQL
Start MySQL and run the complete `database.sql` script in MySQL Workbench or the MySQL command line. It creates database `gym_membership_management_system`, the `members`, `membership_plans`, and `subscriptions` tables, their keys, and Basic / Premium / Elite sample plans. You can run the script repeatedly; the unique plan names and upsert avoid duplicate sample plans.

Default connection:
- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: `root`
- Database: `gym_membership_management_system`

If your local MySQL root password differs, set environment variables before running the app.

**Windows PowerShell**
```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_USER="root"
$env:DB_PASSWORD="your_mysql_password"
$env:DB_NAME="gym_membership_management_system"
npm start
```

**Windows Command Prompt**
```bat
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=your_mysql_password
set DB_NAME=gym_membership_management_system
npm start
```

**macOS / Linux**
```bash
DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD='your_mysql_password' DB_NAME=gym_membership_management_system npm start
```

For a real deployment, use a dedicated MySQL user with limited permissions instead of the root account.

## 2. Install and start
Open a terminal in this folder:
```bash
npm install
npm start
```
Open http://localhost:3000 in your browser.

## Pages
- `index.html`: dashboard statistics and recent subscriptions
- `members.html`: add, view, delete members
- `plans.html`: add, view, delete plans
- `subscriptions.html`: create, view, delete subscriptions; server calculates end dates from plan duration

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check MySQL connection |
| GET | `/api/dashboard` | Statistics and recent subscriptions |
| GET / POST | `/api/members` | List / create members |
| DELETE | `/api/members/:id` | Delete member and cascade-delete subscriptions |
| GET / POST | `/api/plans` | List / create plans |
| DELETE | `/api/plans/:id` | Delete plan if not referenced by subscriptions |
| GET / POST | `/api/subscriptions` | List / create subscriptions |
| DELETE | `/api/subscriptions/:id` | Delete subscription |

Gym photos use the Unsplash image CDN and require internet access; the app itself runs locally.
=======
# Teena-Thanmay-Gym-Membership-System
>>>>>>> b1f761ebe02bc256890bf358ec9ad3e2f1c498db
