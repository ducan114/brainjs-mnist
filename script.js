const inputCanvas = document.querySelector('.inputCanvas');
const trainingAmount = document.querySelector('#training-amount');
const testingAmount = document.querySelector('#testing-amount');
const label = document.querySelector('#label');
const predictLabel = document.querySelector('#predict-label');
const informs = document.querySelector('.informs > pre');

const network = new brain.NeuralNetwork({ hiddenLayers: [8, 8] });
const ctx = inputCanvas.getContext('2d');
const baseSize = 28;
const scale = 10;
const penSize = 2;
let mouseDown = false;
let preX, preY;

inputCanvas.width = baseSize;
inputCanvas.height = baseSize;
inputCanvas.style.setProperty('--baseSize', `${baseSize}px`);
inputCanvas.style.setProperty('--scale', scale);
ctx.lineWidth = penSize;
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';

inputCanvas.addEventListener('mousedown', e => {
  mouseDown = true;
  const rect = e.target.getBoundingClientRect();
  preX = (e.x - rect.left) / scale;
  preY = (e.y - rect.top) / scale;
  ctx.fillRect(preX, preY, penSize, penSize);
});

inputCanvas.addEventListener('mouseup', () => (mouseDown = false));
inputCanvas.addEventListener('mouseout', () => (mouseDown = false));
inputCanvas.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  const rect = e.target.getBoundingClientRect();
  const x = (e.x - rect.left) / scale;
  const y = (e.y - rect.top) / scale;
  ctx.beginPath();
  ctx.moveTo(preX, preY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.closePath();
  preX = x;
  preY = y;
});

document.querySelector('#train').onclick = train;

document.querySelector('#btn-clear').onclick = () => {
  ctx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
  label.value = '';
  predictLabel.value = '';
};

document.querySelector('#btn-predict').onclick = () => {
  const image = ctx.getImageData(
    0,
    0,
    inputCanvas.width,
    inputCanvas.height
  ).data;
  const data = [];
  for (let i = 0; i < image.length; i += 4) {
    data.push(
      image[i] !== 0 || image[i + 1] !== 0 || image[i + 2] !== 0
        ? image[i + 3] / 255
        : 0
    );
  }

  predictLabel.value = getResult(network.run(data));
};

function train() {
  informs.innerText = '';

  const { training: trainingData, test: testingData } = mnist.set(
    trainingAmount.value,
    testingAmount.value
  );

  informs.innerText =
    JSON.stringify(network.train(trainingData)) +
    '\n' +
    'Accuracy on testing data: ' +
    getAcuracy(testingData);
}

function getResult(array) {
  let index = 0;
  let max = array[0];
  for (let i = 1; i < array.length; i++)
    if (array[i] > max) {
      max = array[i];
      index = i;
    }
  return index;
}

function getAcuracy(testingSet) {
  let hit = 0;
  testingSet.forEach(e => {
    const res = network.run(e.input).map(v => Math.round(v));
    if (getResult(res) === getResult(e.output)) hit++;
  });
  return hit / testingSet.length;
}

function getRandomInput() {
  const l = label.value || Math.floor(Math.random() * 10);
  const data = [];

  mnist[l]
    .get()
    .forEach(e =>
      e === 0 ? data.push(0, 0, 0, 0) : data.push(255, 255, 255, e * 255)
    );

  const imageData = new ImageData(
    Uint8ClampedArray.from(data),
    baseSize,
    baseSize
  );
  ctx.putImageData(imageData, 0, 0);
  if (!label.value) label.value = l;
  predictLabel.value = '';
}

document.querySelector('#get-input').onclick = getRandomInput;
