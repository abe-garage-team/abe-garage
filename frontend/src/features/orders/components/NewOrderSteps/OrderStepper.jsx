const STEPS = ['Customer', 'Vehicle', 'Services'];

export default function OrderStepper({ current }) {
  return (
    <ol className="ord-stepper" aria-label="New order progress">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const state = number < current ? 'done' : number === current ? 'current' : 'todo';
        return (
          <li
            key={label}
            className={`ord-step ${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="ord-step-number" aria-hidden="true">
              {number}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
