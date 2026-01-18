// utils/util.js - 通用工具函数

/**
 * 格式化时间
 * @param {Date} date
 * @param {String} format
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 格式化日期（仅日期）
 */
function formatDate(date) {
  return formatTime(date, 'YYYY-MM-DD');
}

/**
 * 格式化价格
 * @param {Number} price
 * @param {Number} decimals
 */
function formatPrice(price, decimals = 2) {
  if (typeof price !== 'number') {
    price = parseFloat(price);
  }
  return `$${price.toFixed(decimals)}`;
}

/**
 * 格式化百分比
 * @param {Number} value
 * @param {Number} decimals
 */
function formatPercent(value, decimals = 2) {
  if (typeof value !== 'number') {
    value = parseFloat(value);
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * 格式化价格变动
 * @param {Number} change
 * @param {Number} changePercent
 */
function formatPriceChange(change, changePercent) {
  const changeStr = change >= 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`;
  const percentStr = formatPercent(changePercent);
  const arrow = change >= 0 ? '↑' : '↓';

  return {
    text: `${changeStr} (${percentStr}) ${arrow}`,
    isPositive: change >= 0,
    arrow: arrow
  };
}

/**
 * 计算波动幅度
 * @param {Number} high
 * @param {Number} low
 * @param {Number} open
 */
function calculateVolatility(high, low, open) {
  if (!open || open === 0) return 0;
  return Math.abs(high - low) / open * 100;
}

/**
 * 判断波动等级
 * @param {Number} volatility 百分比
 */
function getVolatilityLevel(volatility) {
  if (volatility < 0.5) {
    return {
      level: 'small',
      text: '小幅',
      color: '#10B981',
      emoji: '🟢'
    };
  } else if (volatility <= 2) {
    return {
      level: 'medium',
      text: '中度',
      color: '#F59E0B',
      emoji: '🟡'
    };
  } else {
    return {
      level: 'large',
      text: '大幅',
      color: '#EF4444',
      emoji: '🔴'
    };
  }
}

/**
 * 格式化钱包地址
 * @param {String} address
 */
function formatWalletAddress(address) {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 计算倒计时
 * @param {Date} targetTime
 */
function getCountdown(targetTime) {
  const now = new Date();
  const target = new Date(targetTime);
  const diff = target - now;

  if (diff <= 0) {
    return {
      ended: true,
      text: '已结束',
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    ended: false,
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    hours,
    minutes,
    seconds
  };
}

/**
 * 获取今日收盘时间（北京时间凌晨4点）
 */
function getTodayCloseTime() {
  const now = new Date();
  const closeTime = new Date();

  // 设置为今天凌晨4点
  closeTime.setHours(4, 0, 0, 0);

  // 如果当前时间已经超过凌晨4点，设置为明天凌晨4点
  if (now > closeTime) {
    closeTime.setDate(closeTime.getDate() + 1);
  }

  return closeTime;
}

/**
 * 判断是否在交易时段
 */
function isTradingHours() {
  const now = new Date();
  const hours = now.getHours();

  // 简化版：除了4-8点（非交易时段）外都视为交易时段
  // 实际应根据国际黄金市场具体时间调整
  return hours < 4 || hours >= 8;
}

/**
 * 防抖函数
 */
function debounce(func, wait = 500) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
function throttle(func, wait = 500) {
  let timeout;
  let previous = 0;

  return function(...args) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const cloned = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 显示Toast消息
 */
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  });
}

/**
 * 显示确认对话框
 */
function showConfirm(title, content) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          resolve(true);
        } else {
          reject(false);
        }
      },
      fail: reject
    });
  });
}

module.exports = {
  formatTime,
  formatDate,
  formatPrice,
  formatPercent,
  formatPriceChange,
  calculateVolatility,
  getVolatilityLevel,
  formatWalletAddress,
  getCountdown,
  getTodayCloseTime,
  isTradingHours,
  debounce,
  throttle,
  deepClone,
  showToast,
  showConfirm
};
