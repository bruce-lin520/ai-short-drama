// 统一 API 请求封装模块
// 职责：处理网络请求的底层实现，隔离与后端的通信细节

/**
 * 发送 POST 请求
 * @param {string} url - 请求地址
 * @param {object} data - 负载数据
 * @returns {Promise<any>}
 */
export async function post(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP 错误! 状态码: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 请求异常:', error);
    throw error;
  }
}