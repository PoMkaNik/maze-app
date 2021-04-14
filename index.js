const { Engine, Render, Runner, World, Bodies } = Matter;

const cells = 3;
const width = 600;
const height = 600;
const wallThickness = 2;

const unitLength = width / cells;

const engine = Engine.create();
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine,
  options: {
    wireframes: true,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, wallThickness * 2, {
    isStatic: true,
  }),
  Bodies.rectangle(width / 2, height, width, wallThickness * 2, {
    isStatic: true,
  }),
  Bodies.rectangle(0, height / 2, wallThickness * 2, height, {
    isStatic: true,
  }),
  Bodies.rectangle(width, height / 2, wallThickness * 2, height, {
    isStatic: true,
  }),
];
World.add(world, walls);

//
// maze generation
//
const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cells)
  // can't use .fill([false, false, false]
  // because will be created one array and will be put in each row
  // if we change one raw -> all raws will be affected
  .fill(null)
  .map(() => Array(cells).fill(false));

const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false));

const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
  // if i have visited the cell at [row, column] -> return
  if (grid[row][column]) return;
  // if not visited before -> mark this cell as visited
  grid[row][column] = true;
  // assemble randomly-order list of neighbors
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left'],
  ]);
  // for each neighbor..
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
    // see if that neighbor is out of zone (after the wall)
    if (
      nextRow < 0 ||
      nextRow >= cells ||
      nextColumn < 0 ||
      nextColumn >= cells
    ) {
      // skip that neighbors
      continue;
    }

    // if we have visited that neighbor -> continue to next neighbor
    if (grid[nextRow][nextColumn]) continue;

    // remove a wall from either horizontals or verticals
    // left <-> right
    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    }
    // up <-> down
    else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }

    // visit that next cell
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

// draw maze
horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;

    const wall = Bodies.rectangle(
      columnIndex * unitLength + unitLength / 2,
      rowIndex * unitLength + unitLength,
      unitLength,
      wallThickness,
      {
        isStatic: true,
      },
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;

    const wall = Bodies.rectangle(
      columnIndex * unitLength + unitLength,
      rowIndex * unitLength + unitLength / 2,
      wallThickness,
      unitLength,
      {
        isStatic: true,
      },
    );
    World.add(world, wall);
  });
});

// goal shape
const goal = Bodies.rectangle(
  width - unitLength / 2,
  height - unitLength / 2,
  unitLength * 0.7,
  unitLength * 0.7,
  {
    isStatic: true,
  },
);
World.add(world, goal);

// ball shape
const ball = Bodies.circle(unitLength / 2, unitLength / 2, unitLength / 4, {
  isStatic: true,
});
World.add(world, ball);


