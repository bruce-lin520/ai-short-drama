// 下载工具函数模块
// 职责：封装文本导出文件下载逻辑，页面禁止直接创建 <a> 标签导出

/**
 * 下载 Markdown 格式文本文件
 * @param {string} content - 文件内容
 * @param {string} filename - 保存的文件名
 */
export function downloadMarkdown(content, filename = 'storyboard.md') {
  if (!content) return;
  
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // 清理 DOM 及内存 URL
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}