(function () {
  Function.prototype.getName = function () {
    return this.name || this.toString().match(/function\s*([^(]*)\(/)[1]
  }
  'use strict';

  if (typeof (domain) == 'undefined') domain = null
  if (typeof layui == "undefined") {
    $.ajax({
      url: `${domain ? domain : ""}/layui/layui.js`,
      cache: true,
      async: false,
      dataType: "script",
      success: function () {
        layui.link(`${domain ? domain : ""}/layui/css/layui.css`)
        layui.use("layer", function () {
          layer = layui.layer;
        })
        try {
          const font = 'font-family:"Microsoft Yahei";'
          const title = 'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;'
          if (!initialize()) console.error(`%c 统一政民互动 %c ${decodeURI(window.location.pathname)} %c 初始化失败! %c`,
            `${font}${title} color: #fff`,
            'font-family:"Microsoft Yahei";background:#41b883 ; padding: 1px; border-radius: 3px 0 0 3px;  color: white; ',
            'font-family:"Microsoft Yahei";background:red ; padding: 1px; border-radius: 0 3px 3px 0;  color: white; ', 'background: transparent')
          else {
            console.log(
              `%c 统一政民互动 %c ${decodeURI(window.location.pathname)} %c 初始化成功！%c`,
              `${font}${title}  color: #fff`,
              `${font}background:#41b883 ; padding: 1px; border-radius: 3px 0 0 3px; color: white; `,
              `${font}background:#0f81c2 ; padding: 1px; border-radius: 0 3px 3px 0; color: white; `, 'background:transparent')
          }
        } catch (ignore) { console.warn(ignore) }
      }
    })
  }

})();