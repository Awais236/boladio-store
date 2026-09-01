import { ORDER_STATUSES } from '../lib/format';
import { Ic } from '../lib/icons';

const ICONS = [Ic.Cart, Ic.Check, Ic.Box, Ic.Truck, Ic.Clock, Ic.CheckCircle];

export default function OrderTimeline({ status, cancelled }) {
  if (cancelled) {
    return (
      <div className="timeline">
        <div className="tl-step active">
          <div className="tl-dot">
            <Ic.X width={18} height={18} />
          </div>
          <div className="tl-body">
            <h4 style={{ color: 'var(--red)' }}>Order Cancelled</h4>
            <p>This order was cancelled. If you had an issue, contact us and we will help.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeStep = ORDER_STATUSES.find((s) => s.key === status)?.step ?? 0;

  return (
    <div className="timeline">
      {ORDER_STATUSES.map((s, i) => {
        const done = i < activeStep;
        const isActive = i === activeStep;
        const Icon = ICONS[i] || Ic.Check;
        return (
          <div key={s.key} className={`tl-step ${done ? 'done' : ''} ${isActive ? 'active' : ''}`}>
            <div className="tl-dot">
              <Icon />
            </div>
            <div className="tl-body">
              <h4>{s.label}</h4>
              <p>
                {done && 'Completed'}
                {isActive && (
                  <>
                    <span className="live-dot" />
                    {status === 'out_for_delivery' ? 'On its way to you' : status === 'preparing' ? 'We are packing your order' : 'In progress'}
                  </>
                )}
                {!done && !isActive && 'Upcoming'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}