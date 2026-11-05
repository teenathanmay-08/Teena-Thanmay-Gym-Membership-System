# TEENA THANMAY FITNESS — Gym Membership Management System

FSD-2 project built using HTML5, CSS3, JavaScript, Node.js, Express.js and MySQL.

## Requirements

- Node.js 18+ and npm
- MySQL Server 8+ (or compatible)

## 1. Set up MySQL

Start MySQL and run the complete `database.sql` script in MySQL Workbench.

It creates the database `gym_membership_management_system`, the members, membership plans, and subscriptions tables, and sample membership plans.

### Default connection

- Host: localhost
- Port: 3306
- User: root
- Password: root
- Database: gym_membership_management_system

## 2. Install and start

Open a terminal in this folder and run:

```bash
npm install
npm start
```

Open http://localhost:3000 in your browser.

## Pages

- index.html: Dashboard
- members.html: Manage members
- plans.html: Manage membership plans
- subscriptions.html: Manage subscriptions

## API

| Method     | Endpoint               | Purpose                       |
| ---------- | ---------------------- | ----------------------------- |
| GET        | /api/health            | Check MySQL connection        |
| GET        | /api/dashboard         | Dashboard statistics          |
| GET / POST | /api/members           | List and create members       |
| DELETE     | /api/members/:id       | Delete members                |
| GET / POST | /api/plans             | List and create plans         |
| DELETE     | /api/plans/:id         | Delete plans                  |
| GET / POST | /api/subscriptions     | List and create subscriptions |
| DELETE     | /api/subscriptions/:id | Delete subscriptions          |

Gym photos use the Unsplash image CDN and require internet access.
