export const LEGAL_STYLES = `
  .legal-page {
    max-width: 800px;
    margin-inline: auto;
    padding-inline: var(--space-6);
  }
  .legal-h2 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--space-2);
  }
  .legal-page ul {
    list-style: disc;
    padding-left: var(--space-6);
  }
  .legal-page li { margin-bottom: var(--space-1); }
  .legal-page a {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .legal-page a:hover { text-decoration-thickness: 2px; }
  .legal-page a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
  .legal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
    margin-block: var(--space-4);
  }
  .legal-table th,
  .legal-table td {
    text-align: left;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
  }
  .legal-table th {
    background: var(--color-surface-alt);
    font-weight: var(--font-weight-semibold);
  }
`;
