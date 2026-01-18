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
});
