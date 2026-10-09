// @ts-nocheck
import { useState } from 'react';
import { Delete, RotateCcw } from 'lucide-react';

export function CalculatorApp({ setTitle }: { setTitle?: (t: string) => void }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (display === '0' || waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const performOp = (op: string) => {
    setEquation(`${display} ${op}`);
    setWaitingForOperand(true);
  };

  const calculate = () => {
    if (!equation) return;
    const [num1, op] = equation.split(' ');
    const a = parseFloat(num1);
    const b = parseFloat(display);
    let res = 0;

    switch (op) {
      case '+': res = a + b; break;
      case '−': res = a - b; break;
      case '×': res = a * b; break;
      case '÷': res = b !== 0 ? a / b : 0; break;
      default: return;
    }

    const resStr = Number.isInteger(res) ? res.toString() : res.toFixed(4).replace(/\.?0+$/, '');
    setDisplay(resStr);
    setEquation('');
    setWaitingForOperand(true);
  };

  return (
    <div className="calculator-app">
      <div className="calc-screen">
        <div className="calc-equation">{equation}</div>
        <div className="calc-value">{display}</div>
      </div>

      <div className="calc-pad">
        <button className="calc-btn btn-func" onClick={clear}><RotateCcw size={16} /></button>
        <button className="calc-btn btn-func" onClick={backspace}><Delete size={16} /></button>
        <button className="calc-btn btn-op" onClick={() => performOp('÷')}>÷</button>
        <button className="calc-btn btn-op" onClick={() => performOp('×')}>×</button>

        <button className="calc-btn" onClick={() => inputDigit('7')}>7</button>
        <button className="calc-btn" onClick={() => inputDigit('8')}>8</button>
        <button className="calc-btn" onClick={() => inputDigit('9')}>9</button>
        <button className="calc-btn btn-op" onClick={() => performOp('−')}>−</button>

        <button className="calc-btn" onClick={() => inputDigit('4')}>4</button>
        <button className="calc-btn" onClick={() => inputDigit('5')}>5</button>
        <button className="calc-btn" onClick={() => inputDigit('6')}>6</button>
        <button className="calc-btn btn-op" onClick={() => performOp('+')}>+</button>

        <button className="calc-btn" onClick={() => inputDigit('1')}>1</button>
        <button className="calc-btn" onClick={() => inputDigit('2')}>2</button>
        <button className="calc-btn" onClick={() => inputDigit('3')}>3</button>
        <button className="calc-btn btn-equals" onClick={calculate}>=</button>

        <button className="calc-btn btn-zero" onClick={() => inputDigit('0')}>0</button>
        <button className="calc-btn" onClick={inputDecimal}>.</button>
      </div>
    </div>
  );
}
