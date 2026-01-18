Component({
    data: {
        selected: 0,
        color: "#888888",
        selectedColor: "#FFD700",
        list: [
            {
                pagePath: "/pages/index/index",
                text: "Home",
                iconPath: "images/home.png",
                selectedIconPath: "images/home-active.png"
            },
            {
                pagePath: "/pages/history/history",
                text: "History",
                iconPath: "images/history.png",
                selectedIconPath: "images/history-active.png"
            },
            {
                pagePath: "/pages/leaderboard/leaderboard",
                text: "Rank",
                iconPath: "images/leaderboard.png",
                selectedIconPath: "images/leaderboard-active.png"
            }
        ]
    },
    methods: {
        switchTab(e) {
            const data = e.currentTarget.dataset;
            const url = data.path;
            wx.switchTab({ url });
            this.setData({
                selected: data.index
            });
        }
    }
});
