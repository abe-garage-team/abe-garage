export async function recordEmailDelivery({ db, orderId, employeeId = null, sent }) {
  if (typeof sent !== 'boolean') {
    throw new TypeError('sent must be a boolean');
  }

  const action = sent ? 'email_sent' : 'email_failed';

  await db.execute(
    `INSERT INTO order_history (order_id, employee_id, action)
     VALUES (?, ?, ?)`,
    [orderId, employeeId, action],
  );
}
