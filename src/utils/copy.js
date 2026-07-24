// 复制工具函数模块
// 职责：封装文本剪贴板复制逻辑，页面禁止直接操作 navigator.clipboard

/**
 * 将文本复制至剪贴板
 * @param {string} text - 需要复制的文本内容
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyMarkdown(text) {
  if (!text) {
    return false;
  }
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 兼容不支持 clipboard API 的环境
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('剪贴板复制失败:', err);
    return false;
  }
}