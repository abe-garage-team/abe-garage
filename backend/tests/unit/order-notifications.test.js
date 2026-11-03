import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderNotificationService } from '../../src/shared/notifications/notification.service.js';

function setup({ failMail = false, failHistory = false } = {}) {
  const messages = [];
  const history = [];
  const warnings = [];

  const service = createOrderNotificationService({
    getTransport: () => ({
      async sendMail(message) {
        messages.push(message);

        if (failMail) {
          throw new Error('Simulated SMTP failure');
        }

        return { accepted: [message.to] };
      },
    }),
    db: {
      async execute(sql, values) {
        if (failHistory) {
          throw new Error('Simulated database failure');
        }

        history.push(values);
      },
    },
    frontendUrl: 'https://garage.example.com',
    from: 'garage@example.com',
    warn: (entry) => warnings.push(entry),
  });

  return { service, messages, history, warnings };
}

const input = {
  to: 'sara@example.com',
  customerName: 'Sara',
  orderHash: 'demo123',
  orderId: 24,
  employeeId: 7,
};

test('sends an order-created email and records success', async () => {
  const { service, messages, history } = setup();

  const sent = await service.sendOrderCreatedEmail(input);

  assert.equal(sent, true);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, input.to);
  assert.equal(messages[0].subject, 'Your Abe Garage order');
  assert.ok(messages[0].text.includes('https://garage.example.com/order-status/demo123'));
  assert.deepEqual(history, [[24, 7, 'email_sent']]);
});

test('uses the car-ready template for completion emails', async () => {
  const { service, messages, history } = setup();

  const sent = await service.sendCarReadyEmail(input);

  assert.equal(sent, true);
  assert.equal(messages[0].subject, 'Your car is ready — Abe Garage');
  assert.deepEqual(history, [[24, 7, 'email_sent']]);
});

test('SMTP failure returns false and records failure', async () => {
  const { service, history, warnings } = setup({ failMail: true });

  const sent = await service.sendOrderCreatedEmail(input);

  assert.equal(sent, false);
  assert.deepEqual(history, [[24, 7, 'email_failed']]);
  assert.equal(warnings[0].event, 'order_email_delivery_failed');
});

test('history failure does not resend or report accepted mail as failed', async () => {
  const { service, messages, warnings } = setup({ failHistory: true });

  const sent = await service.sendOrderCreatedEmail(input);

  assert.equal(sent, true);
  assert.equal(messages.length, 1);
  assert.equal(warnings[0].event, 'order_email_history_failed');
});

test('combined mail and history failures return false without throwing', async () => {
  const { service, messages, warnings } = setup({
    failMail: true,
    failHistory: true,
  });

  const sent = await service.sendOrderCreatedEmail(input);

  assert.equal(sent, false);
  assert.equal(messages.length, 1);
  assert.deepEqual(
    warnings.map((entry) => entry.event),
    ['order_email_delivery_failed', 'order_email_history_failed'],
  );
});

test('SMTP rejection records failure even when sendMail resolves', async () => {
  const history = [];

  const service = createOrderNotificationService({
    getTransport: () => ({
      async sendMail() {
        return { accepted: [], rejected: [input.to] };
      },
    }),
    db: {
      async execute(sql, values) {
        history.push(values);
      },
    },
    frontendUrl: 'https://garage.example.com',
    from: 'garage@example.com',
    warn: () => {},
  });

  const sent = await service.sendOrderCreatedEmail(input);

  assert.equal(sent, false);
  assert.deepEqual(history, [[24, 7, 'email_failed']]);
});
