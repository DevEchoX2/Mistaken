const taskInput = document.getElementById('taskInput');
const constraintsInput = document.getElementById('constraintsInput');
const resultInput = document.getElementById('resultInput');
const buildPrompt = document.getElementById('buildPrompt');
const copyPrompt = document.getElementById('copyPrompt');

buildPrompt.addEventListener('click', () => {
  const task = taskInput.value.trim() || 'Solve the task clearly.';
  const constraints = constraintsInput.value.trim() || 'Keep output concise and practical.';

  resultInput.value = [
    'You are an expert assistant.',
    `Task: ${task}`,
    `Constraints: ${constraints}`,
    'Return a direct solution first, then a short explanation.'
  ].join('\n');
});

copyPrompt.addEventListener('click', async () => {
  if (!resultInput.value.trim()) {
    return;
  }

  try {
    await navigator.clipboard.writeText(resultInput.value);
    copyPrompt.textContent = 'Copied';
    setTimeout(() => {
      copyPrompt.textContent = 'Copy';
    }, 900);
  } catch {
    copyPrompt.textContent = 'Copy Failed';
  }
});
