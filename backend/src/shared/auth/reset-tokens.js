export async function markAllResetTokensUsed(employeeId, connection) {
  await connection.execute(
    `UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP(6)
     WHERE employee_id = ? AND used_at IS NULL`,
    [employeeId],
  );
}
