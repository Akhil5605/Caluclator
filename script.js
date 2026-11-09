const expressionDisplay = document.querySelector('#expression');
const resultDisplay = document.querySelector('#result');
const angleModeDisplay = document.querySelector('#angle-mode');
const memoryIndicator = document.querySelector('#memory-indicator');
const scientificKeys = document.querySelector('#scientific-keys');
const historyPanel = document.querySelector('#history-panel');
const historyList = document.querySelector('#history-list');
const themeToggle = document.querySelector('#theme-toggle');

let expression = '';
let result = '0';
let memory = 0;
let inverseMode = false;
let angleMode = 'DEG';
let history = [];

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  if (Math.abs(value) > 1e12 || (Math.abs(value) < 1e-9 && value !== 0)) return value.toExponential(8).replace(/\.0+e/, 'e');
  return Number(value.toPrecision(12)).toString();
}

function display() {
  expressionDisplay.textContent = expression || '0';
  resultDisplay.textContent = result;
  angleModeDisplay.textContent = angleMode;
  memoryIndicator.classList.toggle('visible', memory !== 0);
}

function toRadians(value) {
  return angleMode === 'DEG' ? value * Math.PI / 180 : value;
}

function evaluateExpression(input) {
  if (!/^[0-9+\-*/().\sA-Za-z_^%]+$/.test(input) || /\b(?!pi\b|sqrt\b|sin\b|cos\b|tan\b|asin\b|acos\b|atan\b|ln\b|log\b|e\b)[A-Za-z]+/.test(input)) throw new Error('Invalid expression');
  let value = input.replace(/pi/g, `(${Math.PI})`).replace(/e/g, `(${Math.E})`);
  value = value.replace(/sqrt\(([^()]*)\)/g, 'Math.sqrt($1)');
  value = value.replace(/(a?)sin\(([^()]*)\)/g, (_, inverse, number) => inverse ? `Math.asin(${number}) * 180 / Math.PI` : `Math.sin(${toRadians(Number(number))})`);
  value = value.replace(/(a?)cos\(([^()]*)\)/g, (_, inverse, number) => inverse ? `Math.acos(${number}) * 180 / Math.PI` : `Math.cos(${toRadians(Number(number))})`);
  value = value.replace(/(a?)tan\(([^()]*)\)/g, (_, inverse, number) => inverse ? `Math.atan(${number}) * 180 / Math.PI` : `Math.tan(${toRadians(Number(number))})`);
  value = value.replace(/ln\(([^()]*)\)/g, 'Math.log($1)');
  value = value.replace(/log\(([^()]*)\)/g, 'Math.log10($1)');
  value = value.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  value = value.replace(/\^/g, '**');
  return Function(`"use strict"; return (${value})`)();
}

function calculate() {
  if (!expression) return;
  try {
    const openParentheses = (expression.match(/\(/g) || []).length;
    const closedParentheses = (expression.match(/\)/g) || []).length;
    const value = evaluateExpression(expression + ')'.repeat(Math.max(0, openParentheses - closedParentheses)));
    result = formatNumber(value);
    if (result !== 'Error') addHistory(expression, result);
  } catch {
    result = 'Error';
  }
  display();
}

function addHistory(input, output) {
  history.unshift({ input, output });
  history = history.slice(0, 8);
  historyList.innerHTML = history.map(item => `<div class="history-entry"><span>${item.input}</span><span>${item.output}</span></div>`).join('');
}

function appendValue(value) {
  if (result === 'Error') { expression = ''; result = '0'; }
  if (value === 'pi' || value === 'e' || value === 'sqrt' || value === 'sin' || value === 'cos' || value === 'tan' || value === 'ln' || value === 'log') {
    expression += `${inverseMode && ['sin', 'cos', 'tan'].includes(value) ? 'a' : ''}${value}(`;
    if (value === 'pi' || value === 'e') expression = expression.slice(0, -1) + value;
    inverseMode = false;
  } else if (value === '^') {
    expression += '^';
  } else if (value === '%') {
    expression += '%';
  } else {
    expression += value;
  }
  result = '0';
  display();
}

function clear() { expression = ''; result = '0'; display(); }
function backspace() { expression = expression.slice(0, -1); display(); }
function toggleSign() { expression = expression ? `-(${expression})` : '-'; display(); }

function memoryAction(action) {
  const current = Number(result === 'Error' ? 0 : result);
  if (action === 'memory-clear') memory = 0;
  if (action === 'memory-recall') appendValue(formatNumber(memory));
  if (action === 'memory-add') memory += current;
  if (action === 'memory-subtract') memory -= current;
  display();
}

document.querySelectorAll('.key').forEach(button => button.addEventListener('click', () => {
  const { action, value } = button.dataset;
  if (value) appendValue(value);
  if (action === 'equals') calculate();
  if (action === 'clear') clear();
  if (action === 'backspace') backspace();
  if (action === 'toggle-sign') toggleSign();
  if (action === 'inverse') { inverseMode = !inverseMode; button.classList.toggle('active', inverseMode); }
  if (action?.startsWith('memory')) memoryAction(action);
}));

document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.mode-button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  scientificKeys.classList.toggle('visible', button.dataset.mode === 'scientific');
}));

document.querySelector('#history-toggle').addEventListener('click', event => {
  const open = historyPanel.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', open);
});
document.querySelector('#clear-history').addEventListener('click', () => {
  history = [];
  historyList.innerHTML = '<p class="empty-history">Your calculations will appear here.</p>';
});
themeToggle.addEventListener('click', () => {
  const dark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = dark ? 'light' : 'dark';
  themeToggle.innerHTML = dark ? '&#9788;' : '&#9790;';
});

document.addEventListener('keydown', event => {
  if (/^[0-9.]$/.test(event.key)) appendValue(event.key);
  if (['+', '-', '*', '/', '^', '%', '(', ')'].includes(event.key)) appendValue(event.key);
  if (event.key === 'Enter' || event.key === '=') calculate();
  if (event.key === 'Backspace') backspace();
  if (event.key === 'Escape') clear();
});

display();
