export class MedianFilter {
  private window: number[] = [];
  private readonly size: number;

  constructor(size: number = 5) {
    this.size = size;
  }

  process(value: number): number {
    this.window.push(value);
    if (this.window.length > this.size) this.window.shift();
    if (this.window.length === 0) return value;
    const sorted = [...this.window].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  reset() {
    this.window = [];
  }
}
