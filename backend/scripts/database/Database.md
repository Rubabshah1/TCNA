# Importing `tcna_cancer_db.sql` into a Database

This guide explains how to load the `tcna_cancer_db.sql` file into your database system. The file contains all the necessary SQL commands to create and populate the **Cancer Database**.

---

## Prerequisites

Before proceeding, ensure you have:

- **MariaDB** installed and running.
- Access to the MariaDB client (`mysql` command).
- The `tcna_cancer_db.sql` file available in your current working directory.
- A database user with privileges to create and modify databases.

---

## Import into MariaDB

If you haven’t already created a database to import into, run:

### 1. Create a new database (optional)

```bash
mysql -u root -p -e "CREATE DATABASE tcna_cancer_db;"


