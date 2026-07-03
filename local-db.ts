import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'local_db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function getFilePath(collection: string): string {
  return path.join(DB_DIR, `${collection}.json`);
}

function readCollection(collection: string): any[] {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading collection ${collection}:`, err);
    return [];
  }
}

function writeCollection(collection: string, data: any[]): void {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing collection ${collection}:`, err);
  }
}

export class LocalCollectionReference {
  constructor(private name: string) {}

  doc(id?: string) {
    const finalId = id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: finalId,
      get: async () => {
        const items = readCollection(this.name);
        const found = items.find(item => item.id === finalId);
        return {
          exists: !!found,
          data: () => found,
        };
      },
      set: async (data: any) => {
        const items = readCollection(this.name);
        const index = items.findIndex(item => item.id === finalId);
        const record = { id: finalId, ...data };
        if (index > -1) {
          items[index] = record;
        } else {
          items.push(record);
        }
        writeCollection(this.name, items);
      },
      update: async (data: any) => {
        const items = readCollection(this.name);
        const index = items.findIndex(item => item.id === finalId);
        if (index > -1) {
          items[index] = { ...items[index], ...data, id: finalId };
          writeCollection(this.name, items);
        } else {
          throw new Error(`Document with ID ${finalId} not found in ${this.name}`);
        }
      },
      delete: async () => {
        const items = readCollection(this.name);
        const filtered = items.filter(item => item.id !== finalId);
        writeCollection(this.name, filtered);
      }
    };
  }

  async get() {
    const items = readCollection(this.name);
    return {
      size: items.length,
      empty: items.length === 0,
      docs: items.map(item => ({
        id: item.id,
        ref: this.doc(item.id),
        data: () => item
      }))
    };
  }

  // Simple query methods
  where(field: string, op: '==' | '<=' | '>=' | '<' | '>', value: any) {
    return {
      where: (f2: string, op2: '==' | '<=' | '>=' | '<' | '>', val2: any) => {
        return this.whereChain([
          { field, op, value },
          { field: f2, op: op2, value: val2 }
        ]);
      },
      orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => {
        return this.whereChain([{ field, op, value }]).orderBy(orderField, direction);
      },
      get: async () => {
        return this.whereChain([{ field, op, value }]).get();
      }
    };
  }

  private whereChain(filters: { field: string, op: string, value: any }[]) {
    return {
      where: (f: string, op: string, val: any) => {
        filters.push({ field: f, op, value: val });
        return this.whereChain(filters);
      },
      orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => {
        return {
          get: async () => {
            const result = await this.executeFilters(filters);
            return this.sortResults(result, orderField, direction);
          }
        };
      },
      get: async () => {
        return this.executeFilters(filters);
      }
    };
  }

  private async executeFilters(filters: { field: string, op: string, value: any }[]) {
    let items = readCollection(this.name);
    for (const f of filters) {
      items = items.filter(item => {
        const val = item[f.field];
        if (f.op === '==') return val === f.value;
        if (f.op === '<=') return val <= f.value;
        if (f.op === '>=') return val >= f.value;
        if (f.op === '<') return val < f.value;
        if (f.op === '>') return val > f.value;
        return true;
      });
    }
    return {
      size: items.length,
      empty: items.length === 0,
      docs: items.map(item => ({
        id: item.id,
        ref: this.doc(item.id),
        data: () => item
      }))
    };
  }

  private sortResults(result: any, field: string, direction: 'asc' | 'desc') {
    const docs = [...result.docs];
    docs.sort((a, b) => {
      const valA = a.data()[field];
      const valB = b.data()[field];
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return {
      size: docs.length,
      empty: docs.length === 0,
      docs
    };
  }
}

export class LocalFirestore {
  collection(name: string) {
    return new LocalCollectionReference(name);
  }

  async runTransaction(cb: (transaction: any) => Promise<any>) {
    const transaction = {
      get: async (refOrQuery: any) => {
        if (typeof refOrQuery.get === 'function') {
          return refOrQuery.get();
        }
        return refOrQuery;
      },
      set: async (docRef: any, data: any) => {
        await docRef.set(data);
      },
      update: async (docRef: any, data: any) => {
        await docRef.update(data);
      }
    };
    return cb(transaction);
  }
}

export const localDb = new LocalFirestore();
