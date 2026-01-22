document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabs = document.querySelectorAll('.tab-item');
    const views = document.querySelectorAll('.view');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update views
            views.forEach(v => {
                v.classList.remove('active');
                if (v.id === `${target}-view`) {
                    v.classList.add('active');
                }
            });
        });
    });

    // Direction selection
    const dirBtns = document.querySelectorAll('.dir-btn');
    dirBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dirBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update trade button color
            const tradeBtn = document.getElementById('confirm-trade');
            if (btn.id === 'btn-up') {
                tradeBtn.style.background = '#22c55e';
            } else {
                tradeBtn.style.background = '#ef4444';
            }
        });
    });

    // Volatility selection
    const volItems = document.querySelectorAll('.vol-item');
    volItems.forEach(item => {
        item.addEventListener('click', () => {
            volItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Mock Gold Price Updates
    const priceEl = document.getElementById('gold-price');
    const changeEl = document.getElementById('gold-change');
    let basePrice = 2045.50;

    function updatePrice() {
        const fluctuation = (Math.random() - 0.5) * 0.5;
        basePrice += fluctuation;
        priceEl.textContent = basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const change = basePrice - 2038.20;
        const percent = (change / 2038.20) * 100;
        const sign = change >= 0 ? '+' : '';
        const arrow = change >= 0 ? '↑' : '↓';

        changeEl.textContent = `${sign}$${Math.abs(change).toFixed(2)} (${sign}${percent.toFixed(2)}%) ${arrow}`;
        changeEl.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
    }

    setInterval(updatePrice, 3000);

    // Refresh button animation
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
            updatePrice();
        }, 300);
    });

    // Trade Confirmation
    const tradeBtn = document.getElementById('confirm-trade');
    const modal = document.getElementById('success-modal');
    const closeModal = document.getElementById('close-modal');

    tradeBtn.addEventListener('click', () => {
        tradeBtn.textContent = '锁定中...';
        tradeBtn.disabled = true;

        setTimeout(() => {
            modal.classList.add('active');
            tradeBtn.textContent = '锁定预测';
            tradeBtn.disabled = false;
        }, 800);
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Quick amounts
    const quickBtns = document.querySelectorAll('.quick-btn');
    const amountInput = document.querySelector('.amount-input');

    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.textContent === 'MAX') {
                amountInput.value = 1250;
            } else {
                amountInput.value = btn.textContent;
            }
        });
    });

    // --- Luffa Wallet Integration ---
    const walletInfo = document.querySelector('.wallet-info');
    const walletAddressEl = document.querySelector('.wallet-address');
    const walletLabelEl = document.querySelector('.wallet-label');

    function create16String() {
        const len = 16;
        const strVals = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        const maxLen = strVals.length;
        let randomStr = '';
        for (let i = 0; i < len; i++) {
            randomStr += strVals.charAt(Math.floor(Math.random() * maxLen));
        }
        return randomStr;
    }

    function formatAddress(addr) {
        if (!addr) return '';
        return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
    }

    async function connectWallet() {
        console.log('尝试连接 Luffa 钱包...');

        const opts = {
            api_name: 'luffaWebRequest',
            data: {
                uuid: create16String(),
                methodName: "connect",
                initData: {
                    network: "endless",
                },
                metadata: {
                    superBox: true,
                    url: window.location.href,
                    icon: "https://goldbet.app/icon.png" // 示意图标
                },
                from: "",
                data: {},
            },
            success: (res) => {
                console.log('Luffa 连接成功:', res);
                if (res.data && res.data.address) {
                    const address = res.data.address;
                    walletAddressEl.textContent = formatAddress(address);
                    walletLabelEl.textContent = '已连接 Luffa 钱包';
                    walletLabelEl.style.color = '#22c55e';

                    // 可选：保存到本地
                    localStorage.setItem('walletAddress', address);
                }
            },
            fail: (err) => {
                console.error('Luffa 连接失败:', err);
                alert('连接钱包失败，请确保在 Luffa 环境中运行');
            }
        };

        if (window.wx && window.wx.invokeNativePlugin) {
            window.wx.invokeNativePlugin(opts);
        } else if (window.parent && window.parent.wx && window.parent.wx.invokeNativePlugin) {
            // 兼容在 iframe/WebView 中通过父窗口调用
            window.parent.wx.invokeNativePlugin(opts);
        } else {
            console.warn('当前环境不支持 Luffa 原生接口');
            alert('请在 Luffa App 中打开以连接钱包');
        }
    }

    // 点击钱包区域触发连接
    if (walletInfo) {
        walletInfo.style.cursor = 'pointer';
        walletInfo.addEventListener('click', connectWallet);
    }

    // 检查缓存的地址
    const cachedAddress = localStorage.getItem('walletAddress');
    if (cachedAddress) {
        walletAddressEl.textContent = formatAddress(cachedAddress);
        walletLabelEl.textContent = '已连接 Luffa 钱包';
    }
});
