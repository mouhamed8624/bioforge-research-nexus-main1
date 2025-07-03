
# MySQL Backend Setup Instructions

This document provides instructions on setting up the MySQL backend for the BioLabs Management System.

## Prerequisites

1. Install Node.js and npm (https://nodejs.org/)
2. Install MySQL Server (https://dev.mysql.com/downloads/mysql/)
3. Install a MySQL client (like MySQL Workbench) for database administration

## Backend Setup Steps

### 1. Create a new directory for the backend

```bash
mkdir biolabs-backend
cd biolabs-backend
npm init -y
```

### 2. Install required packages

```bash
npm install express cors mysql2 dotenv
npm install --save-dev typescript ts-node nodemon @types/express @types/cors
```

### 3. Create a TypeScript configuration file (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

### 4. Create an environment file (.env)

```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=biolabs_db
```

### 5. Create the database structure

Connect to your MySQL server and run:

```sql
CREATE DATABASE biolabs_db;

USE biolabs_db;

CREATE TABLE inventory_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  stock INT NOT NULL,
  capacity INT NOT NULL,
  status ENUM('ok', 'low', 'critical', 'overstock') NOT NULL,
  location VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  order_status VARCHAR(100)
);

CREATE TABLE equipment_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status ENUM('Available', 'In Use', 'Maintenance', 'Out of Order') NOT NULL,
  location VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  serial_number VARCHAR(50),
  last_maintenance DATE
);

CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(100) NOT NULL,
  order_date DATE NOT NULL
);
```

### 6. Create the backend structure

Create the following files and directories:

```
biolabs-backend/
├── src/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   ├── inventoryController.ts
│   │   ├── equipmentController.ts
│   │   └── orderController.ts
│   ├── routes/
│   │   ├── inventoryRoutes.ts
│   │   ├── equipmentRoutes.ts
│   │   └── orderRoutes.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

### 7. Database Connection (src/config/db.ts)

```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
```

### 8. Inventory Controller (src/controllers/inventoryController.ts)

```typescript
import { Request, Response } from 'express';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

// Function to determine status based on stock and capacity
const determineStatus = (stock: number, capacity: number): string => {
  const ratio = stock / capacity;
  if (ratio <= 0.1) return 'critical';
  if (ratio <= 0.3) return 'low';
  if (ratio >= 1.1) return 'overstock';
  return 'ok';
};

export const getAllInventoryItems = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory_items');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'Failed to fetch inventory items' });
  }
};

export const addInventoryItem = async (req: Request, res: Response) => {
  try {
    const { name, category, stock, capacity, location, unit, orderStatus } = req.body;
    
    // Calculate status based on stock and capacity
    const status = determineStatus(stock, capacity);
    
    const id = uuidv4();
    
    await pool.query(
      'INSERT INTO inventory_items (id, name, category, stock, capacity, status, location, unit, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, stock, capacity, status, location, unit, orderStatus || null]
    );
    
    res.status(201).json({
      id,
      name,
      category,
      stock,
      capacity,
      status,
      location,
      unit,
      orderStatus: orderStatus || undefined
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ message: 'Failed to add inventory item' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    
    const [result] = await pool.query(
      'UPDATE inventory_items SET order_status = ? WHERE id = ?',
      [orderStatus, id]
    );
    
    // @ts-ignore
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};
```

### 9. Equipment Controller (src/controllers/equipmentController.ts)

```typescript
import { Request, Response } from 'express';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export const getAllEquipmentItems = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM equipment_items');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching equipment items:', error);
    res.status(500).json({ message: 'Failed to fetch equipment items' });
  }
};

export const addEquipmentItem = async (req: Request, res: Response) => {
  try {
    const { name, status, location, type, serialNumber, lastMaintenance } = req.body;
    
    const id = uuidv4();
    
    await pool.query(
      'INSERT INTO equipment_items (id, name, status, location, type, serial_number, last_maintenance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, status, location, type || null, serialNumber || null, lastMaintenance || null]
    );
    
    res.status(201).json({
      id,
      name,
      status,
      location,
      type: type || undefined,
      serialNumber: serialNumber || undefined,
      lastMaintenance: lastMaintenance || undefined
    });
  } catch (error) {
    console.error('Error adding equipment item:', error);
    res.status(500).json({ message: 'Failed to add equipment item' });
  }
};
```

### 10. Order Controller (src/controllers/orderController.ts)

```typescript
import { Request, Response } from 'express';
import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export const getAllOrderItems = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM order_items');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ message: 'Failed to fetch order items' });
  }
};

export const addOrderItem = async (req: Request, res: Response) => {
  try {
    const { name, status, orderDate } = req.body;
    
    const id = uuidv4();
    
    await pool.query(
      'INSERT INTO order_items (id, name, status, order_date) VALUES (?, ?, ?, ?)',
      [id, name, status, orderDate]
    );
    
    res.status(201).json({
      id,
      name,
      status,
      orderDate
    });
  } catch (error) {
    console.error('Error adding order item:', error);
    res.status(500).json({ message: 'Failed to add order item' });
  }
};
```

### 11. Routes (src/routes/inventoryRoutes.ts, etc.)

```typescript
// src/routes/inventoryRoutes.ts
import express from 'express';
import { getAllInventoryItems, addInventoryItem, updateOrderStatus } from '../controllers/inventoryController';

const router = express.Router();

router.get('/', getAllInventoryItems);
router.post('/', addInventoryItem);
router.patch('/:id/order-status', updateOrderStatus);

export default router;

// src/routes/equipmentRoutes.ts
import express from 'express';
import { getAllEquipmentItems, addEquipmentItem } from '../controllers/equipmentController';

const router = express.Router();

router.get('/', getAllEquipmentItems);
router.post('/', addEquipmentItem);

export default router;

// src/routes/orderRoutes.ts
import express from 'express';
import { getAllOrderItems, addOrderItem } from '../controllers/orderController';

const router = express.Router();

router.get('/', getAllOrderItems);
router.post('/', addOrderItem);

export default router;
```

### 12. Main Server File (src/index.ts)

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inventoryRoutes from './routes/inventoryRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### 13. Add scripts to package.json

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "nodemon --exec ts-node src/index.ts"
}
```

### 14. Start the backend server

```bash
npm run dev
```

## Additional Notes

1. Make sure your MySQL server is running before starting the backend
2. You may need to install the uuid package: `npm install uuid @types/uuid`
3. Update the frontend API_URL in src/services/mysql/mysqlService.ts to match your backend URL
4. For production, consider using a connection pooling service or hosting provider
