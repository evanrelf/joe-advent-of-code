import { input, print } from "common";

type Node = {
  char: string;
  location: { x: number; y: number };
  // My initial reaction seeing these four `boolean`s was: "oh, this should be
  // an enum representing the possible pipe shape!", but reading more closely,
  // I think your idea is better.
  //
  // The pipe shape doesn't matter. The directions in which the pipe is open is
  // what matters!
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
};

function main() {
  const raw = input(2023, 10);
  print(pt1(raw), pt2(raw));
}

function pt1(raw: string): number {
  const nodeMap = raw
    .split("\n")
    .map((line) => line.split(""))
    // Oh cool, I didn't realize the callback function you give to `map` was
    // given an optional index argument. Very handy!
    .map((line, y) => line.map((char, x) => setNode(char, y, x)));
  const pathMap = setPath(nodeMap, "S");
  return pathMap.furthestSteps;
}

function pt2(raw: string): number {
  const nodeMap = raw
    .split("\n")
    .map((line) => line.split(""))
    .map((line, y) => line.map((char, x) => setNode(char, y, x)));
  const pathMap = setPath(nodeMap, "S");
  return countInsideNodes(pathMap.pathMap, "S");
}

// I wouldn't call this `setNode`, because you're not mutating anything, you're
// constructing something!
//
// Maybe a better name would be `makeNode`/`mkNode`, `buildNode`, `createNode`,
// or just `node` (my favorite).
function setNode(char: string, y: number, x: number): Node {
  let north = false;
  let south = false;
  let east = false;
  let west = false;

  switch (char) {
    case "|":
      north = true;
      south = true;
      break;
    case "-":
      east = true;
      west = true;
      break;
    case "L":
      north = true;
      east = true;
      break;
    case "J":
      north = true;
      west = true;
      break;
    case "7":
      south = true;
      west = true;
      break;
    case "F":
      south = true;
      east = true;
      break;
    case "S":
      north = true;
      south = true;
      east = true;
      west = true;
      break;
    default:
      break;
  }

  // FYI you can replace any occurance of `fieldName: fieldName` with just
  // `fieldName`. Like this:
  // ```typescript
  // return {
  //   char,
  //   location: { x, y },
  //   north,
  //   south,
  //   east,
  //   west,
  // };
  // ```
  return {
    char: char,
    location: { x: x, y: y },
    north: north,
    south: south,
    east: east,
    west: west,
  };
}

// Same comment here about naming. I don't think you're setting a path. More
// like constructing a path, or finding a path.
function setPath(
  nodeMap: Node[][],
  pathChar: string,
): { furthestSteps: number; pathMap: Node[][] } {
  const copyMap = structuredClone(nodeMap);
  const start = getStartNode(copyMap);
  copyMap[start.location.y][start.location.x] = start;

  let steps = 0;
  let active = getNeighbors(copyMap, start);
  const traveled: Record<string, Node> = {};

  while (active.length > 0) {
    // Oof, it pains me to see `next` defined as `const`, but then can be
    // `push`ed to below. Not that you've done anything wrong, I just hate that
    // `const` is IMO kind of a lie / nearly meaningless in JavaScript.
    const next = [];
    for (const node of active) {
      node.char = pathChar;
      traveled[nodeID(node)] = node;
      const neighbors = getNeighbors(copyMap, node)
        .filter((node) => traveled[nodeID(node)] === undefined);
      next.push(...neighbors);
    }
    active = next;
    steps += 1;
  }

  return { furthestSteps: steps, pathMap: copyMap };
}

function getNeighbors(nodeMap: Node[][], node: Node): Node[] {
  const neighbors: Node[] = [];

  // 1. I guess this relies on JavaScript returning `undefined` for invalid
  //    indexes?
  //
  //    I'm used to writing extra code to check for going out of bounds
  //    with stuff like this, but I guess you can take advantage of JavaScript's
  //    behavior here for more concise code.
  //
  // 2. I'd destructure `node.location` so this is a little more readable / less
  //    repetitive. Like this:
  //
  //    ```typescript
  //    const { x, y } = node.location;
  //    const northNode = nodeMap[y - 1][x];
  //    const southNode = nodeMap[y + 1][x];
  //    const eastNode = nodeMap[y][x + 1];
  //    const westNode = nodeMap[y][x - 1];
  //    ```
  const northNode = nodeMap[node.location.y - 1][node.location.x];
  const southNode = nodeMap[node.location.y + 1][node.location.x];
  const eastNode = nodeMap[node.location.y][node.location.x + 1];
  const westNode = nodeMap[node.location.y][node.location.x - 1];

  if (node.north && northNode.south) neighbors.push(northNode);
  if (node.south && southNode.north) neighbors.push(southNode);
  if (node.east && eastNode.west) neighbors.push(eastNode);
  if (node.west && westNode.east) neighbors.push(westNode);

  return neighbors;
}

function countInsideNodes(nodeMap: Node[][], pathChar: string): number {
  let count = 0;
  for (const line of nodeMap) {
    let inside = false;
    let left = undefined;
    for (const node of line) {
      // You could combine these `if`s into one (not sure if parens are needed):
      // ```typescript
      // if ((node.char !== pathChar) && inside) {
      //   count += 1;
      // } else if ...
      // ```
      // Pretty nit picky though, doesn't really matter.
      if (node.char !== pathChar) {
        if (inside) count += 1;
      } // Boundary Line - flip inside
      else if (node.north && node.south) {
        inside = !inside;
      } // Boundary Corner -- determine to flip inside
      else if (node.north || node.south) {
        // Wait for next corner
        if (left === undefined) {
          left = node;
        } // Edge - dont flip, reset left corner
        else if ((left.north && node.north) || (left.south && node.south)) {
          left = undefined;
        } // Boundary - flip
        else {
          inside = !inside;
          left = undefined;
        }
      }
    }
  }
  return count;
}

// I think people like using the `const f = (x, y) => ...;` style of writing
// functions especially for cases like these, because the lambda style allows
// omitting the `return` if you only have a single expression, and not multiple
// statements. Can make things really concise, for example:
//
// ```typescript
// const nodeId = ({ location: { x, y } }: Node): string => `${x},${y}`;
// ```
function nodeID(node: Node): string {
  return `${node.location.x},${node.location.y}`;
}

function getStartNode(renderedMap: Node[][]): Node {
  const start = startNode(renderedMap);
  // This clone feels pointless, since `start` is never referenced anywhere else
  // in this function. But I suspect it's here for a reason?
  //
  // Would mutating `start` mutate the `renderedMap` you passed in? If that's
  // the case, omg so cursed.
  const clone = structuredClone(start);

  // I'd destructure `clone.location` so this is a little more readable / less
  // repetitive. Like this:
  // ```typescript
  // const { x, y } = clone.location;
  // clone.north = renderedMap[y - 1][x].south;
  // clone.south = renderedMap[y + 1][x].north;
  // clone.east = renderedMap[y][x + 1].west;
  // clone.west = renderedMap[y][x - 1].east;
  // ```

  clone.north = renderedMap[clone.location.y - 1][clone.location.x].south;
  clone.south = renderedMap[clone.location.y + 1][clone.location.x].north;
  clone.east = renderedMap[clone.location.y][clone.location.x + 1].west;
  clone.west = renderedMap[clone.location.y][clone.location.x - 1].east;

  // Perhaps instead of cloning and then mutating, you could just build a new
  // one? Something like this instead:
  //
  // ```typescript
  // return {
  //   north: renderedMap[y - 1][x].south,
  //   south: renderedMap[y + 1][x].north,
  //   east: renderedMap[y][x + 1].west,
  //   west: renderedMap[y][x - 1].east,
  //   ...start
  // };
  // ```
  return clone;
}

function startNode(renderedMap: Node[][]): Node {
  for (const line of renderedMap) {
    for (const node of line) {
      if (node.char === "S") return node;
    }
  }
  // Is 0,0 a valid fallback start node, or is this just a lack of error
  // handling?
  return renderedMap[0][0];
}

main();
