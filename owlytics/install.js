(() => {
  const button = document.querySelector('.owl-copy');
  const command = document.getElementById('owl-install-command');
  if (!button || !command || !navigator.clipboard?.writeText) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(command.textContent.trim());
      button.textContent = 'Copied!';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(command);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Select & copy';
    }
    setTimeout(() => {
      button.textContent = 'Copy';
      button.disabled = false;
    }, 1800);
  });
})();
