Page({
    data: {
        faqs: [
            {
                question: '什么是 Matrixdock 黄金 (XAUm)?',
                answer: 'XAUm 是部署在多条链上的标准化代币，每个代币与 1 金衡盎司 LBMA 标准实物黄金 1:1 挂钩。 XAUm 的总供应量将始终等于存储在 LBMA 金库中的基础资产数量。',
                open: true
            },
            {
                question: '通过铸造和闪兑来获取 XAUm 有何区别?',
                answer: '1. 铸造XAUm有更好的价格，支持无限订单规模，T+3 结算。因为这涉及到新的实物金条的采购，进而在链上铸造出新的 XAUm 代币；\n2. 通过闪兑来购买 XAUm 可实现即时结算，可获取的XAUm的规模取决于当前流动性。涉及的是流通中的 XAUm 代币，这些代币是由已经存储在金库中的实物金条作为支撑的。',
                open: true
            },
            {
                question: '如何赎回实物资产?',
                answer: '您可以用 XAUm 代币兑换稳定币或实物资产。这将需要开户及验证。兑换实物资产时，请联系我们的团队，安排必要的手续。',
                open: true
            },
            {
                question: '相关费用是多少?',
                answer: 'ERC-20/BEP-20 和 NFT 形式的 XAUm 均不收取管理费。在 XAUm 的 TVL 达到 1 亿美元之前，铸币费免除。赎回订单收取 0.25% 的费用。',
                open: true
            },
            {
                question: '铸造和赎回的 XAUm 最低数量是多少?',
                answer: '通过 Matrixdock 平台直接铸币的最低金额为 $10k；赎回为稳定币或实物资产的最低数量为 32.148 XAUm，相当于 32.148 金衡盎司 (1 公斤) 金条。\n数额较小的XAUm买卖需求可以通过闪兑功能来完成。',
                open: true
            }
        ]
    },

    toggleFaq(e) {
        const index = e.currentTarget.dataset.index;
        const key = `faqs[${index}].open`;
        this.setData({
            [key]: !this.data.faqs[index].open
        });
    },

    goToBuy() {
        const url = 'https://sep25-share.mptcamp.com/newRegister/cn?invite_code=2TU87D';
        wx.navigateTo({
            url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
        });
    }
})
