import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getInitialSampleData } from './src/data/sampleData.ts';
import { BusinessProfile, RecoveryAction, Transaction } from './src/types/cashflow.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseState {
  profile: BusinessProfile;
  transactions: Transaction[];
  recoveryActions: RecoveryAction[];
}

function loadDatabase(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed reading DB file, seeding fresh sample data', err);
  }
  const initial = getInitialSampleData();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving DB file', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // In-memory + persistent cache
  let db = loadDatabase();

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get('/api/data', (_req: Request, res: Response) => {
    res.json(db);
  });

  app.post('/api/profile', (req: Request, res: Response) => {
    const updated = req.body as Partial<BusinessProfile>;
    db.profile = { ...db.profile, ...updated };
    saveDatabase(db);
    res.json(db.profile);
  });

  app.get('/api/transactions', (_req: Request, res: Response) => {
    res.json(db.transactions);
  });

  app.post('/api/transactions', (req: Request, res: Response) => {
    const tx = req.body as Transaction;
    if (!tx.id) {
      tx.id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    // Validation
    if (!tx.party || !tx.amount || tx.amount <= 0 || !tx.date) {
      res.status(400).json({ error: 'Party, positive amount, and valid date are required.' });
      return;
    }

    const idx = db.transactions.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      db.transactions[idx] = tx;
    } else {
      db.transactions.push(tx);
    }
    saveDatabase(db);
    res.json(tx);
  });

  app.delete('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.transactions = db.transactions.filter((t) => t.id !== id);
    saveDatabase(db);
    res.json({ success: true, id });
  });

  app.post('/api/reset-sample', (_req: Request, res: Response) => {
    db = getInitialSampleData();
    saveDatabase(db);
    res.json(db);
  });

  app.post('/api/recovery-actions/toggle', (req: Request, res: Response) => {
    const { id, applied } = req.body;
    const act = db.recoveryActions.find((a) => a.id === id);
    if (act) {
      act.applied = Boolean(applied);
      saveDatabase(db);
      res.json(act);
      return;
    }
    res.status(404).json({ error: 'Action not found' });
  });

  // Export CSV
  app.get('/api/export-csv', (_req: Request, res: Response) => {
    const headers = ['ID', 'Type', 'Category', 'Status', 'Date', 'Amount', 'Party', 'Description', 'InvoiceNumber', 'Notes'];
    const rows = db.transactions.map((t) => [
      t.id,
      t.type,
      t.category,
      t.status,
      t.date,
      t.amount,
      `"${(t.party || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.invoiceNumber || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="cashflow_transactions.csv"');
    res.send(csvContent);
  });

  // AI-Powered Executive Summary (Gemini API with @google/genai)
  app.post('/api/ai-insights', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.json({
          insight: 'Gemini API Key is not configured. Deterministic rule-based insights are fully active on your dashboard.',
          isLiveAI: false,
        });
        return;
      }

      const { summary, profile } = req.body;
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a CFO advising a small business owner (${profile.businessName}).
Available Cash: $${profile.currentCashBalance}. Min Safety Reserve: $${profile.minCashReserve}.
Current Health: ${summary.healthStatus}.
Predicted Shortage Date: ${summary.firstZeroShortageDate || summary.firstReserveShortageDate || 'None'}.
Deficit Amount: $${summary.firstZeroShortageAmount || summary.firstReserveShortageAmount}.
Upcoming Expenses: $${summary.totalUpcomingExpenses}. Expected Inflows: $${summary.totalExpectedReceipts}.
Provide 3 bullet points with direct, practical small business cash recovery advice. Be concise, realistic, and empathetic. Do not use jargon.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        insight: response.text,
        isLiveAI: true,
      });
    } catch (err: any) {
      console.error('Gemini call error:', err);
      res.json({
        insight: 'Standard deterministic financial analysis is operating normally.',
        isLiveAI: false,
        error: err.message,
      });
    }
  });

  // Mount Vite middlewares for SPA rendering in dev
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CashFlow Guardian AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
