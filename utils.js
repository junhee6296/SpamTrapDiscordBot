function cutText(text, max = 1000) {
  if (!text) return '없음';
  const normalized = String(text).trim();
  if (!normalized) return '없음';
  return normalized.length > max ? `${normalized.slice(0, max - 20)}\n...내용 생략...` : normalized;
}

function formatBooleanOX(value) {
  return value ? 'O' : 'X';
}

module.exports = {
  cutText,
  formatBooleanOX,
};
