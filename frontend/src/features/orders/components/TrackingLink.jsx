import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function TrackingLink({ url }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="ord-copy">
      <input
        className="form-control"
        type="text"
        readOnly
        value={url}
        aria-label="Customer tracking link"
        onFocus={(event) => event.target.select()}
      />
      <button type="button" className="btn btn-outline-secondary" onClick={copy}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        <span role="status">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
}
