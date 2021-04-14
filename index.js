const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 4;
const cellsVertical = 3;
// 0.99 used to remove scrollbars
const width = window.innerWidth * 0.99;
const height = window.innerHeight * 0.99;
const wallThickness = 2;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// borders
const walls = [
  Bodies.rectangle(width / 2, 0, width, wallThickness * 3, {
    label: 'border',
    isStatic: true,
    render: {
      fillStyle: 'red',
    },
  }),
  Bodies.rectangle(width / 2, height, width, wallThickness * 3, {
    label: 'border',
    isStatic: true,
    render: {
      fillStyle: 'red',
    },
  }),
  Bodies.rectangle(0, height / 2, wallThickness * 3, height, {
    label: 'border',
    isStatic: true,
    render: {
      fillStyle: 'red',
    },
  }),
  Bodies.rectangle(width, height / 2, wallThickness * 3, height, {
    label: 'border',
    isStatic: true,
    render: {
      fillStyle: 'red',
    },
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

const grid = Array(cellsVertical)
  // can't use .fill([false, false, false]
  // because will be created one array and will be put in each row
  // if we change one raw -> all raws will be affected
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

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
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
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
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      wallThickness,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red',
        },
      },
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      wallThickness,
      unitLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red',
        },
      },
    );
    World.add(world, wall);
  });
});

// goal shape
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    isStatic: true,
    label: 'goal',
    render: {
      fillStyle: 'green',
    },
  },
);
World.add(world, goal);

// ball shape
const ball = Bodies.circle(
  unitLengthX / 2,
  unitLengthY / 2,
  Math.min(unitLengthX, unitLengthY) / 4,
  {
    label: 'ball',
    render: {
      fillStyle: 'lightblue',
    },
  },
);
World.add(world, ball);

// keypress events
document.addEventListener('keydown', (event) => {
  const { x, y } = ball.velocity;
  if (event.keyCode === 87) Body.setVelocity(ball, { x, y: y - 5 });
  if (event.keyCode === 68) Body.setVelocity(ball, { x: x + 5, y });
  if (event.keyCode === 83) Body.setVelocity(ball, { x, y: y + 5 });
  if (event.keyCode === 65) Body.setVelocity(ball, { x: x - 5, y });
});

// win condition
Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((collision) => {
    const labels = ['ball', 'goal'];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector('.winner').classList.remove('hidden');
      document.querySelector('.btn').addEventListener('click', () => {
        location.reload();
      });
      world.gravity.y = 1;
      world.bodies.forEach((el) => {
        if (el.label === 'wall') Body.setStatic(el, false);
      });
    }
  });
});
