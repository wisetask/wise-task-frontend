import type {Graph} from "@/entities/graph"

const HISTORY_LIMIT = 100;

export class GraphHistory {
  private readonly past: Graph[] = [];
  private readonly future: Graph[] = [];

  record(graph: Graph): void {
      this.past.push(graph);
      if (this.past.length > HISTORY_LIMIT) {
        this.past.shift();
      }
      this.future.length = 0;
    }

  undo(current: Graph): Graph {
    const previous = this.past.pop();
    if (previous === undefined) return current;
    this.future.push(current);
    return previous;
  }

  redo(current: Graph): Graph {
    const next = this.future.pop();
    if (next === undefined) return current;
    this.past.push(current);
    return next;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past.length = 0;
    this.future.length = 0;
  }
}