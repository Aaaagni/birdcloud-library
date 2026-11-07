/* BirdCloud.Library 羽毛纹路交互背景
 * 鼠标移动时，散落的羽毛如风吹般波动，并带出淡淡涟漪
 * 纯 ES5，兼容旧浏览器；canvas 置于内容层之下，不拦截点击 */
(function () {
    "use strict";
    var dpr = window.devicePixelRatio || 1;
    var canvas = document.createElement("canvas");
    canvas.id = "feather-bg";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;";
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0;

    var COLORS = [
        [122, 92, 46],    // 深棕
        [176, 122, 42],   // 琥珀
        [166, 143, 92],   // 卡其
        [150, 110, 74],   // 驼色
        [133, 82, 50],    // 赭石
        [186, 148, 96]    // 橡木
    ];

    var feathers = [];
    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: false };
    var ripples = [];
    var lastRipple = 0;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        build();
    }

    function build() {
        feathers = [];
        var n = Math.max(14, Math.round(W * H / 92000));
        for (var i = 0; i < n; i++) {
            var c = COLORS[Math.floor(Math.random() * COLORS.length)];
            feathers.push({
                x: Math.random() * W,
                y: H * (0.16 + Math.random() * 0.74),
                size: 70 + Math.random() * 120,
                angle: -0.32 + Math.random() * 0.64,
                phase: Math.random() * Math.PI * 2,
                color: c,
                speed: 1.6 + Math.random() * 2.4
            });
        }
    }

    window.addEventListener("mousemove", function (e) {
        mouse.tx = e.clientX / W;
        mouse.ty = e.clientY / H;
        mouse.on = true;
        var now = Date.now();
        if (now - lastRipple > 90) {
            lastRipple = now;
            ripples.push({ x: e.clientX, y: e.clientY, r: 8, a: 0.15, life: 1 });
            if (ripples.length > 8) ripples.shift();
        }
    });
    window.addEventListener("touchmove", function (e) {
        if (e.touches && e.touches.length) {
            mouse.tx = e.touches[0].clientX / W;
            mouse.ty = e.touches[0].clientY / H;
            mouse.on = true;
        }
    }, { passive: true });
    window.addEventListener("resize", resize);

    function drawFeather(f, t) {
        var dx = f.x / W - mouse.x;
        var dy = f.y / H - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);      // 归一化距离，约 0~1.4
        var influence = Math.max(0, 1 - dist * 1.8);  // 鼠标越近，波动越强
        var amp = 0.42 * influence;
        var col = f.color;
        var steps = 22;
        var blade = f.size;
        var maxW = f.size * 0.30;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);
        for (var i = 0; i <= steps; i++) {
            var tt = i / steps;              // 0 根部 → 1 尖端
            var yy = -blade * tt;
            var swell = Math.sin(tt * Math.PI);           // 叶片轮廓（两端收窄）
            var wave = Math.sin(tt * 7 + f.phase + t * f.speed + influence * 3.4) * amp * maxW * 0.95;
            var w = Math.max(0, swell * maxW + wave);     // 羽枝半宽（随鼠标波动）
            ctx.lineWidth = 0.8 + swell * 0.5;
            ctx.strokeStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + (0.10 + 0.17 * swell) + ")";
            ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(-w, yy - w * 0.55); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy - w * 0.55); ctx.stroke();
        }
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + ",0.28)";
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -blade); ctx.stroke();
        ctx.restore();
    }

    function frame(t) {
        ctx.clearRect(0, 0, W, H);
        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;
        var i, j;
        for (i = 0; i < feathers.length; i++) {
            drawFeather(feathers[i], t / 1000);
        }
        for (j = ripples.length - 1; j >= 0; j--) {
            var rp = ripples[j];
            rp.r += 1.7;
            rp.a *= 0.94;
            rp.life -= 0.02;
            if (rp.life <= 0 || rp.a < 0.01) { ripples.splice(j, 1); continue; }
            var g = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, rp.r);
            g.addColorStop(0, "rgba(255,255,255," + rp.a.toFixed(3) + ")");
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, 6.2832); ctx.fill();
        }
        requestAnimationFrame(frame);
    }

    resize();
    requestAnimationFrame(frame);
})();
