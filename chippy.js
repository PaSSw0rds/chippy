/**
 * 要求上下文存储一段信息
 */
const storeMessage = (key, value) => {
    // 当调用该方法的是子页面时，自己改变自己的HASH属性，并让父页面获取
    if (window.top !== window.self) {
        window.location.hash = `${key}=${value}`;
        sendMessage(function () {
            __iframe = window.document.getElementById('trsiframe') || window.document.getElementsByTagName('iframe')[0];
            const matches = __iframe.getAttribute('src').toString().match(/\#(.*)\=(.*)/);
            var key = matches[1];
            var value = matches[2];
            window.sessionStorage.setItem(key, value);
        })
    }
    if (window.top === window.self) {
        sendMessage({ [key]: value, type: 'store' });
    }
}

/**
 * 自动发送消息
 * 如果当前页面是子页面，则自动向父页面发送信息，否则反之
 * 如果发送的消息跨域的话，父窗口向子窗口发送消息的时候只能向定义的域名发送
 * @param {object[]} body - 要发送的消息，如果传入的是函数，则自动执行函数，否则判断对象的type类型
 * @param {string} body.type - 如果是存储信息，则type为store
 */
const sendMessage = (body, iframe = window.document.getElementById('trsiframe') || window.document.getElementsByTagName('iframe')[0], domain) => {
    const UID = "TRSID";
    const iframe2parent = (body) => {
        window.parent.postMessage(body, "*");
    }
    const parent2iframe = (body, iframe, url = domain) => {
        const send = () => {
            iframe.contentWindow.postMessage(body);
        }
        new Promise((resolve, reject) => {
            // 监听iframe的complete事件，当iframe加载完成后再发送消息
            if (iframe.contentWindow.document.readyState === 'complete') {
                resolve();
            } else {
                reject()
            }
        }).then(() => {
            send()
        }).catch(() => {
            // 如果iframe没有加载完成，则监听load事件，当iframe加载完成后再发送消息
            try {
                iframe.contentWindow.addEventListener('load', function () {
                    send()
                })
            } catch (error) {
                // 如果iframe没有加载完成，也无法监听load事件，则直接发送消息
                if (error instanceof DOMException) {
                    if (typeof body === 'function') {
                        body = {
                            data: body.toString(), type: 'function'
                        }
                    }
                    iframe.contentWindow.postMessage(body, domain)
                } else {
                    console.error(error)
                }
            }

        });
    }
    if (typeof body === 'function') {
        body = {
            UID,
            data: body.toString(),
            type: 'function'
        };
    }
    body["UID"] = UID;
    if (window.top === window.self) {
        parent2iframe(body, iframe, domain);
    } else if (window.parent) { iframe2parent(body, iframe); }
};

const handleMessage = (e) => {
    if (e.data.UID !== "TRSID") return;
    const domainWithoutProtocol = e.origin.replace(/(^\w+:|^)\/\//, '');
    const regex = /^[a-zA-Z0-9-_\.]+/;
    const suffix = domainWithoutProtocol.match(regex)[0];
    //if (!/\.gov\.cn$/.test(suffix)) return;
    if (typeof e.data === 'boolean') { }
    else if (typeof e.data === 'string') { }
    else if (typeof e.data === 'object' && e.data.type == "function") {
        const f = eval(`(${e.data.data})`);
        f();
    }
    else if (typeof e.data === 'object' && e.data.type == "store") {
        delete e.data.type;
        function recursiveObjectEntries(obj) {
            Object.entries(obj).forEach(([key, value]) => {
                window.sessionStorage.setItem(key, value);
                if (typeof value === "object" && value !== null) {
                    recursiveObjectEntries(value); // 递归遍历嵌套对象
                }
            });
        }
        recursiveObjectEntries(e.data)
    }
    else if (typeof e.data === 'undefined') { }

}
window.addEventListener("message", handleMessage, false);

// 调用浏览器API向操作系统发送一段通知
const notifyWithBroswer = (title, body, icon) => {
    if (!window.Notification) return;
    if (window.Notification.permission === 'granted') {
        new window.Notification(title, { body, icon });
    } else {
        window.Notification.requestPermission((permission) => {
            if (permission === 'granted') {
                new window.Notification(title, { body, icon });
            }
        });
    }
}
/* const _throttle = throttle(inputChange, 3000, {
    leading: false,
    trailing: true,
    resultCallback: function (res) {
        console.log("resultCallback:", res)
    }
})
const tempCallback = (...args) => {
    _throttle.apply(inputEl, args).then(res => {
        console.log("Promise:", res)
    })
}
inputEl.oninput = tempCallback */
/**
 * 节流函数
 * @param {*} fn        要执行的函数
 * @param {*} interval  间隔时间
 * @param {*} options   配置项
 * @returns  取消节流函数
 */
const throttle = (fn, interval, options = { leading: true, trailing: false }) => {
    const { leading, trailing, resultCallback } = options;
    let lastTime = 0;
    let timer = null;

    const _throttle = (...args) => {
        return new Promise((resolve, reject) => {
            const nowTime = new Date().getTime();
            if (!lastTime && !leading) lastTime = nowTime;

            const remainTime = interval - (nowTime - lastTime);
            if (remainTime <= 0) {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }

                const result = fn.apply(this, args);
                if (resultCallback) resultCallback(result);
                resolve(result);
                lastTime = nowTime;
                return;
            }

            if (trailing && !timer) {
                timer = setTimeout(() => {
                    timer = null;
                    lastTime = leading ? nowTime : 0;
                    const result = fn.apply(this, args);
                    if (resultCallback) resultCallback(result);
                    resolve(result);
                }, remainTime);
            }
        });
    };

    _throttle.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
        lastTime = 0;
    };

    return _throttle;
};
/**
 * 防抖函数
 * @param {*} fn 要执行的函数
 * @param {*} delay 防抖间隔
 * @param {*} immediate 是否第一次立即执行
 * @param {*} resultCallback 回调
 * @example
 * const inputChange = (debounce((that) => {
            console.log(that)
        }, 1000, false, () => { console.log('end') }))
        document.getElementsByTagName('input')[0].addEventListener('input', inputChange)
 * @returns 取消防抖功能
 */
const debounce = (fn, delay, immediate = false, resultCallback) => {
    let timer = null;
    let isInvoke = false;
    let that = this;
    const _debounce = (...args) => {

        return new Promise((resolve, reject) => {
            if (timer) clearTimeout(timer);
            const invokeFn = () => {
                const result = fn.apply(this, args);
                if (resultCallback) resultCallback(result);
                resolve(result);
                isInvoke = false;
                timer = null;
            };

            if (immediate && !isInvoke) {
                const result = fn.apply(this, args);
                if (resultCallback) resultCallback(result);
                resolve(result);
                isInvoke = true;
                timer = setTimeout(invokeFn, delay);
            } else {
                timer = setTimeout(invokeFn, delay);
            }
        });
    };

    _debounce.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
        isInvoke = false;
    };

    return _debounce;
};

/**
 * 判断元素是否在可视区域内
IntersectionObserver 构造函数接受一个可选的配置对象作为第二个参数，可以用来配置观察器的行为。下面是可以配置的属性列表：
root：指定根元素，即用来计算目标元素与之交叉的容器元素。默认为视口（window）。可以是一个 DOM 元素或 null。
rootMargin：用于指定视口与目标元素的边界距离。可以使用像素（px）或百分比（%）作为单位。默认值为 "0px 0px 0px 0px"。
thresholds：一个数组，用于指定一个或多个阈值。阈值是一个介于 0 和 1 之间的数值，表示目标元素与视口交叉的比例。默认值为 [0]。
trackVisibility：一个布尔值，表示是否要追踪目标元素的可见性。默认为 false。
delay：一个整数，用于指定延迟触发回调函数的时间（以毫秒为单位）。默认值为 0。
recordOnce：一个布尔值，表示是否只记录一次目标元素的交叉信息。默认为 false。
 * @example
 * var input = document.querySelector('input');
        ob.observe(input, {
            attributes: true,
            attributeFilter: ['value']
    });
    const overpull = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio === 1) {
                console.log('流加载已可视')
                window.addEventListener('touchstart', handleTouchStart);
                window.addEventListener('touchend', handleTouchEnd);
                window.addEventListener('touchmove', handleTouchMove);
            }
        });
    }, { threshold: 1, rootMargin: '20px' });    
 */
const ob = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            console.log(entry.target);
            observer.unobserve(entry.target);
        }
    });
})

const getQueryString = (name, search) => {
    search = search || window.location.search.substring(1) || window.location.hash.split("?")[1] || "";
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let r = search.match(reg);
    if (r != null) return decodeURIComponent(r[2]); return null;
}

const timestampToDateTime = (timestamp) => {
    if (typeof timestamp === 'string') {
        timestamp = parseInt(timestamp);
    }
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}
console.log(
    `%c Chippy %c 君子不器，成己达人，知白守黑，卑以自牧 %c`,
    'font-family:"Microsoft Yahei";background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
    'font-family:"Microsoft Yahei";background:#0f81c2 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff',
    'background:transparent'
)