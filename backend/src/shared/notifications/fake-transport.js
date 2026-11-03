const sentMessages = [];

export function createFakeMailTransport() {
  return {
    async sendMail(message) {
      sentMessages.push({ ...message, sentAt: new Date() });
      return { accepted: [message.to] };
    },
  };
}

export function getFakeSentMessages() {
  return sentMessages;
}

export function clearFakeSentMessages() {
  sentMessages.length = 0;
}
