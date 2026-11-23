export const ORDER_STATUS = Object.freeze({
  AWAITING_APPROVAL: 1,
  APPROVED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  DECLINED: 5,
});


export const ORDER_STATUS_OPTIONS = [
  { value: 1, label: 'Awaiting approval' },
  { value: 2, label: 'Approved' },
  { value: 3, label: 'In progress' },
  { value: 4, label: 'Completed' },
  { value: 5, label: 'Declined' },
];

export const LINE_STATUS_LABELS = Object.freeze({ 0: 'Not started', 1: 'In progress', 2: 'Done' });

export const APPROVAL_METHODS = [
  { value: 'phone', label: 'By phone' },
  { value: 'in_person', label: 'In person' },
];


export const HISTORY_LABELS = Object.freeze({
  order_created: 'Order created',
  order_updated: 'Order updated',
  estimate_approved: 'Estimate approved',
  estimate_declined: 'Estimate declined',
  extra_work_added: 'Extra work added',
  approval_required: 'Approval required again',
  email_sent: 'Customer email sent',
  email_failed: 'Customer email failed',
});


export const NOTE_MAX_LENGTH = 2000;
export const MONEY_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
