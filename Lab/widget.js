// jQuery火箭图标返回顶部代码
$(function () {
        var rocketToTop = $("#rocket-to-top"),
                documentScrollTop = 0,
                animationInterval,
                animationInProgress = false;

        function updateRocketPosition() {
                var currentPosition = rocketToTop.css("background-position");
                if (rocketToTop.css("display") === "none" || animationInProgress) {
                        clearInterval(animationInterval);
                        rocketToTop.css("background-position", "0px 0px");
                        return;
                }

                switch (currentPosition) {
                        case "0px 0px":
                                rocketToTop.css("background-position", "-298px 0px");
                                break;
                        case "-298px 0px":
                                rocketToTop.css("background-position", "-447px 0px");
                                break;
                        case "-447px 0px":
                                rocketToTop.css("background-position", "-596px 0px");
                                break;
                        case "-596px 0px":
                                rocketToTop.css("background-position", "-745px 0px");
                                break;
                        case "-745px 0px":
                                rocketToTop.css("background-position", "-298px 0px");
                }
        }

        function handleScroll() {
                documentScrollTop = $(document).scrollTop();
                if (documentScrollTop === 0) {
                        if (rocketToTop.css("background-position") === "0px 0px") {
                                rocketToTop.fadeOut("slow");
                        } else if (!animationInProgress) {
                                animationInProgress = true;
                                $(".level-2").css("opacity", 1);
                                rocketToTop.delay(100).animate({
                                        marginTop: "-1000px"
                                }, "normal", function () {
                                        rocketToTop.css({
                                                "margin-top": "-125px",
                                                display: "none"
                                        });
                                        animationInProgress = false;
                                });
                        }
                } else {
                        rocketToTop.fadeIn("slow");
                }
        }

        $(window).on('scroll', handleScroll);

        rocketToTop.hover(
                function () {
                        $(".level-2").stop(true).animate({ opacity: 1 });
                },
                function () {
                        $(".level-2").stop(true).animate({ opacity: 0 });
                }
        );

        $(".level-3").click(function () {
                if (animationInProgress) return;
                animationInterval = setInterval(updateRocketPosition, 50);
                $("html,body").animate({ scrollTop: 0 }, "slow");
        });
});

/**
 * 显示带有标题和内容的提示窗口
 *
 * @param str 窗口显示的内容
 */
function divshowAlert(str) {
        const msgWidth = 400; // 提示窗口的宽度
        const msgHeight = 100; // 提示窗口的高度
        const titleHeight = 25; // 提示窗口标题高度
        const borderColor = "#007ECE"; // 提示窗口的边框颜色
        const titleColor = "#99CCFF"; // 提示窗口的标题颜色
        const bgOpacity = 0.6; // 背景透明度

        // 获取文档尺寸
        const sWidth = document.body.offsetWidth - 25;
        const sHeight = document.body.scrollHeight;

        // 创建背景遮罩层
        const bgObj = document.createElement("div");
        bgObj.id = "bgDiv";
        bgObj.style.position = "absolute";
        bgObj.style.top = "0";
        bgObj.style.left = "0";
        bgObj.style.background = "#777";
        bgObj.style.opacity = bgOpacity;
        bgObj.style.width = sWidth + "px";
        bgObj.style.height = sHeight + "px";
        bgObj.style.zIndex = "10000";

        // 创建消息框
        const msgObj = document.createElement("div");
        msgObj.id = "msgDiv";
        msgObj.style.background = "white";
        msgObj.style.border = `1px solid ${borderColor}`;
        msgObj.style.position = "absolute";
        msgObj.style.left = "50%";
        msgObj.style.top = `50%`;
        msgObj.style.transform = "translate(-50%, -50%)";
        msgObj.style.width = msgWidth + "px";
        msgObj.style.height = msgHeight + "px";
        msgObj.style.textAlign = "center";
        msgObj.style.lineHeight = `${titleHeight}px`;
        msgObj.style.zIndex = "10001";

        // 创建标题栏
        const title = document.createElement("h4");
        title.id = "msgTitle";
        title.style.margin = "0";
        title.style.padding = "3px";
        title.style.fontSize = "16px";
        title.style.fontWeight = "bold";
        title.style.background = borderColor;
        title.style.border = `1px solid ${borderColor}`;
        title.style.height = `${titleHeight + 5}px`; // Adjusted for padding
        title.style.color = "white";
        title.style.cursor = "pointer";
        title.textContent = "关闭";
        title.onclick = function () {
                document.body.removeChild(bgObj);
                document.body.removeChild(msgObj);
        };

        // 设置消息文本
        const txt = document.createElement("p");
        txt.style.margin = "1em 0";
        txt.id = "msgTxt";
        txt.innerHTML = str;

        // 组装DOM结构
        document.body.appendChild(bgObj);
        msgObj.appendChild(title);
        msgObj.appendChild(txt);
        document.body.appendChild(msgObj);
}


//====================
// 按Enter键,执行事件
// 当文本框中按下 Enter 键时触发 searchBing 函数
$("#fake-editable").on("keydown", function (event) {
        if (event.key === 'Enter') searchBing();
});

// 当按钮被点击时触发 searchBing 函数，并阻止默认行为
$("#btn").on("click", function (event) {
        event.preventDefault(); // 阻止默认行为
        searchBing();
});

// 跳转到 Bing 搜索页面
function searchBing() {
        var inputElement = $("#fake-editable");
        if (!inputElement.length) {
                console.error("Element with ID 'fake-editable' not found.");
                return;
        }
        var searchValue = inputElement.value.trim();

        if (searchValue) {
                // 验证搜索值是否包含恶意脚本
                if (/[\x00-\x1F\x7F-\x9F<>&]/.test(searchValue)) {
                        console.error("Invalid search value detected.");
                        return;
                }
                window.location.href = "https://www.bing.com/search?q=" + encodeURIComponent(searchValue);
        } else {
                console.log("No search value provided."); // 改为log以减少错误信息的突出显示
        }
}