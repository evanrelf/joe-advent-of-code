export function input(year: number, day: number): string {
  return Deno.readTextFileSync(`./input/${year}/day${day}.txt`);
}

export function print(pt1: string | number, pt2?: string | number): void {
  console.log(`Part 1: ${pt1}`);
  console.log(`Part 2: ${pt2}`);
}