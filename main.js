// 主题色
const color = {
	"line": "#9fff95CC",
	"background": "#000",
	"background2": "#222",
	"text": "#FFF",
	"evu": "#ffef5b96",
	"evd": "#11fbbf96"
}
// 全局变量 / 数据管理
// ============================================================================================
window.$ = (e) => {
	return document.getElementById(e);
}
var mode = "computer";
/*
mode 变量详解
"computer": 正常的电脑操作，按下键盘，在鼠标的位置放音符
"q": 手机操作，点击屏幕时放下 Tap（"w""e" 同理）
"r": 手机操作，滑动屏幕时放下 Hold
*/
var playing = 0;
var ctx = document.getElementById("cvs").getContext("2d");
ctx.font = "30px Arial";
ctx.textBaseline = "middle"; // 文字垂直居中
var imgs = [new Image(), new Image(), new Image(), new Image()];
const dpr = window.devicePixelRatio;
imgs[0].src = "img/Tap.png";
imgs[1].src = "img/Hold.png";
imgs[2].src = "img/Flick.png";
imgs[3].src = "img/Drag.png";
var n = 114514, heng = 4, shu = 7, hi = 200; // 小节数，横着分几格，竖着分几格，每小节高度
var selection = []; // 当前选中的音符
var selection_ev = []; // 当前选中的事件，格式：[编号，类型]
var put_hold_st = null, put_hold_x; // 放置 Hold 音符用
var put_ev_st = null, put_ev_x; // 放置事件用
var control_down = 0; // ctrl 键是否按下
var bpm = 80;
var edit_event = 0; // 是否编辑事件
var in_download = 0; // 下载中？
var nrr = { // notes render rect
	x1: 100,
	y1: 0,
	x2: 1500,
	y2: 900
}
var evrr = { // events render rect
	x1: 850,
	y1: 0,
	x2: 1500,
	y2: 900
}
var all_data = new_empty_data();
var notes = null; // 当前判定线的音符
for (let i = 0; i < 5; i++) all_data.judgeLineList.push(new_judge_line());
notes = all_data.judgeLineList[0].notes;
var evs = null; // 当前判定线的事件
var evs_layer = 0; // 选中的事件层级
evs = all_data.judgeLineList[0].eventLayers;

function isBeat(e) {
	return e.length == 3 && !isNaN(e[0]) && !isNaN(e[1]) && !isNaN(e[2]);
}
function cmparray(a, b) {
	// Array.isArray(a) && Array.isArray(b) && 
	return a.length == b.length && a.every((v, i) => v == b[i]);
}
// 音符管理
// ============================================================================================
var notecontrol = {
	/*
	本模块不使用 nrr 变量，需要手动传入渲染的矩形范围，这样更灵活
	*/
	add: function (type, time, x, u = 1) { // 注意：调用此函数会自动更新渲染缓存，除非更改参数 u
		/*
		type: 1tap 2hold 3flick 4drag
		*/
		notes.push({
			"above": 1,
			"alpha": 255,
			"endTime": time,
			"isFake": 0,
			"positionX": x,
			"size": 1.0,
			"speed": 1.0,
			"startTime": time,
			"type": type,
			"visibleTime": 9999999.0,
			"yOffset": 0.0
		});
		if (u) this.update();
	},
	addhold: function (st, ed, x, u = 1) { // 注意：调用此函数会自动更新渲染缓存，除非更改参数 u
		/*
		type: 1tap 2hold 3flick 4drag
		*/
		notes.push({
			"above": 1,
			"alpha": 255,
			"endTime": ed,
			"isFake": 0,
			"positionX": x,
			"size": 1.0,
			"speed": 1.0,
			"startTime": st,
			"type": 2,
			"visibleTime": 9999999.0,
			"yOffset": 0.0
		});
		if (u) this.update();
	},
	/*
	音符区域相对坐标：1350*900（rpe 坐标系），(0,0) 为正中心，向上向右为正，仅在渲染时转换为绝对坐标
	put_note，select_note 等函数同理
	*/
	render_line: (x1, y1, x2, y2, _shu = shu) => {
		ctx.strokeStyle = color.line;
		for (let i = Math.floor(Math.max(-rdelta / hi, 0)); i < n; i++) {
			for (let j = 0; j < heng; j++) {
				ctx.lineWidth = (j == 0 ? 4 : 1);
				let y = (i * hi + (j / heng) * hi) - 450;
				y += rdelta;
				if (y > 450) break;
				let ty = y2 - ((y + 450) / 900) * (y2 - y1); // 绝对坐标
				ctx.beginPath();
				ctx.moveTo(x1, ty);
				ctx.lineTo(x2, ty);
				ctx.closePath();
				ctx.stroke();
			}
		}
		ctx.lineWidth = 1;
		for (let j = 0; j <= _shu; j++) {
			let tx = x1 + (j / _shu) * (x2 - x1); // 绝对坐标
			ctx.beginPath();
			ctx.moveTo(tx, y1);
			ctx.lineTo(tx, y2);
			ctx.closePath();
			ctx.stroke();
		}
	},
	render_cache: [], // 储存渲染时的 x、y、y2（rpe 坐标系，y2 仅限 hold）、ang、t（类型）、id
	update: function () {
		this.render_cache = [];
		var mp = new Map();
		for (let i = 0; i < notes.length; i++) {
			let y = -450 + hi * (notes[i].startTime[0] + notes[i].startTime[1] / notes[i].startTime[2]);
			let h = ((Math.round(notes[i].positionX) * 100000 + Math.round(y)) / 10).toFixed(0);
			let t = mp.get(h) ?? 0;
			if (t < 10) { // 堆叠过多时不显示
				let y2 = (notes[i].type == 2) ? -450 + hi * (notes[i].endTime[0] + notes[i].endTime[1] / notes[i].endTime[2]) : y;
				this.render_cache.push({
					"x": notes[i].positionX,
					"y": y,
					"y2": y2,
					"ang": t * 25 * Math.PI / 180,
					"t": notes[i].type,
					"id": i
				});
				mp.set(h, t + 1);
			}
		}
	},
	render: function (x1, y1, x2, y2) {
		var mp = new Map();
		function draw(t, x, y, sz, ang /* canvas 坐标系 */) {
			let w = 1089 * sz, h = [100, null, 200, 60][t - 1] * sz;
			if (x + w >= 0 && x <= 1600 && y + h >= 0 && y <= 900) { // 屏幕内的才绘制
				ctx.translate(x, y), ctx.rotate(ang);
				ctx.drawImage(imgs[t - 1], - w / 2, - h / 2, w, h);
				ctx.rotate(-ang), ctx.translate(-x, -y);
			}
		}
		function drawhold(x, y, y2, sz /* canvas 坐标系 */) {
			let w = 1089 * sz;
			ctx.drawImage(imgs[1], x - w / 2, y, w, y2 - y);
		}
		this.render_line(x1, y1, x2, y2);
		for (let i = 0; i < this.render_cache.length; i++) {
			if (this.render_cache[i].t == 2) {
				let st = this.render_cache[i].y + rdelta;
				let ed = this.render_cache[i].y2 + rdelta;
				drawhold(x1 + (x2 - x1) * ((this.render_cache[i].x + 675) / 1350), y2 - ((st + 450) / 900) * (y2 - y1), y2 - ((ed + 450) / 900) * (y2 - y1), (selection.includes(this.render_cache[i].id) ? 0.13 : 0.1));
			}
		}
		if (put_hold_st != null) {
			let ed = -450 + hi * (put_hold_st[0] + put_hold_st[1] / put_hold_st[2]);
			ed += rdelta;
			drawhold(x1 + (x2 - x1) * ((put_hold_x + 675) / 1350), mousedata.y, y2 - ((ed + 450) / 900) * (y2 - y1), 0.1);
		}
		for (let i = 0; i < this.render_cache.length; i++) {
			if (this.render_cache[i].t != 2) {
				y = this.render_cache[i].y + rdelta;
				draw(this.render_cache[i].t, x1 + (x2 - x1) * ((this.render_cache[i].x + 675) / 1350), y2 - ((y + 450) / 900) * (y2 - y1), (selection.includes(this.render_cache[i].id) ? 0.13 : 0.1), this.render_cache[i].ang);
			}
		}
	},
	put_calc: (x1, y1, x2, y2, tx, ty, _shu = shu) => { // 根据鼠标坐标，推出被点击音符的位置
		if (tx < x1 || tx > x2 || ty < y1 || ty > y2) return;

		let x = (tx - x1) / (x2 - x1) * 1350 - 675;
		let y = (y2 - ty) / (y2 - y1) * 900 - 450;
		y -= rdelta;

		if (y < -450) return;

		let a = Math.floor((y + 450) / hi);
		let b = Math.round((y + 450) % hi / (hi / heng));

		return [Math.round((x - 675) / (1350 / _shu)) * (1350 / _shu) + 675, [a, b, heng]];
	},
	put: function (x1, y1, x2, y2, tx, ty, type) {
		if (tx < x1 || tx > x2 || ty < y1 || ty > y2) return;

		let a = this.put_calc(x1, y1, x2, y2, tx, ty);
		if (a != undefined) this.add(type, a[1], a[0]);
	},
	hold_calc: (x, yst, yed, x1, y1, x2, y2) => { // 坐标 x，时间范围 (yst-yed)，渲染区间 (x1,y1) 到 (x2,y2)，求出到鼠标的距离的平方
		yst += rdelta;
		yed += rdelta;
		let tx = x1 + (x2 - x1) * ((x + 675) / 1350);
		// 长条下面的 y（开始触发），上面的 y（结束触发），tyst > tyed
		let tyst = y2 - ((yst + 450) / 900) * (y2 - y1), tyed = y2 - ((yed + 450) / 900) * (y2 - y1);
		let d = 0;
		if (mousedata.y > tyed && mousedata.y < tyst) {
			d = (tx - mousedata.x) * (tx - mousedata.x);
		} else if (mousedata.y < tyed) {
			d = (tx - mousedata.x) * (tx - mousedata.x) + 4 * (tyed - mousedata.y) * (tyed - mousedata.y);
		} else {
			d = (tx - mousedata.x) * (tx - mousedata.x) + 4 * (tyst - mousedata.y) * (tyst - mousedata.y);
		}
		return d;
	},
	check_select: function (x1, y1, x2, y2) {
		let minn = Infinity, ans;
		for (let i = 0; i < notes.length; i++) {
			if (notes[i].type == 2) continue;
			let y = -450 + hi * (notes[i].startTime[0] + notes[i].startTime[1] / notes[i].startTime[2]);
			y += rdelta;
			let tx = x1 + (x2 - x1) * ((notes[i].positionX + 675) / 1350);
			let ty = y2 - ((y + 450) / 900) * (y2 - y1);
			let d = (tx - mousedata.x) * (tx - mousedata.x) + 4 * (ty - mousedata.y) * (ty - mousedata.y)
			if (d < minn) minn = d, ans = i; // 选中音符
		}
		if (minn > 6000) {
			for (let i = 0; i < notes.length; i++) {
				if (notes[i].type != 2) continue;
				let yst = -450 + hi * (notes[i].startTime[0] + notes[i].startTime[1] / notes[i].startTime[2]);
				let yed = -450 + hi * (notes[i].endTime[0] + notes[i].endTime[1] / notes[i].endTime[2]);
				let d = this.hold_calc(notes[i].positionX, yst, yed, x1, y1, x2, y2);
				if (d < minn) minn = d, ans = i; // 选中音符
			}
		}
		return ans;
	},
	edit: () => { // 显示编辑面板
		if (selection.length == 1) {
			$("edit").style.display = "block";
			$("edit-x").value = notes[selection[0]].positionX;
			$("edit-y").value = notes[selection[0]].yOffset;
			$("edit-time").value = notes[selection[0]].startTime[0] + ":" + notes[selection[0]].startTime[1] + "/" + notes[selection].startTime[2];
			$("edit-time2").value = notes[selection[0]].endTime[0] + ":" + notes[selection[0]].endTime[1] + "/" + notes[selection].endTime[2];
			$("edit-d").value = notes[selection[0]].above;
			$("edit-t").value = notes[selection[0]].isFake;
		}
	},
	hedit: () => { // 隐藏编辑面板
		$("edit").style.display = "none";
	},
	initedit: () => { // 保存编辑面板
		$("edit-x").addEventListener("change", () => {
			if (selection.length > 0) {
				let tmp = Number($("edit-x").value);
				if (isNaN(tmp)) $("edit-x").value = notes[selection][0].positionX;
				else {
					for (let i = 0; i < selection.length; i++) notes[selection[i]].positionX = tmp;
					notecontrol.update();
				}
			}
		});
		$("edit-y").addEventListener("change", () => {
			if (selection.length > 0) {
				let tmp = Number($("edit-y").value);
				if (isNaN(tmp)) $("edit-y").value = notes[selection][0].yOffset;
				else {
					for (let i = 0; i < selection.length; i++) notes[selection[i]].yOffset = tmp;
				}
			}
		});
		$("edit-time").addEventListener("change", () => {
			if (selection.length == 1) {
				let s = $("edit-time").value.split(/[:\/]/);
				if (isBeat(s)) {
					notes[selection].startTime = [Number(s[0]), Number(s[1]), Number(s[2])];
					if (notes[selection].type != 2) $("edit-time2").value = $("edit-time").value, notes[selection].endTime = notes[selection].startTime;
					notecontrol.update();
				}
			}
		});
		$("edit-time2").addEventListener("change", () => {
			if (selection.length == 1) {
				let s = $("edit-time").value.split(/[:\/]/);
				if (isBeat(s)) {
					notes[selection].endTime = [Number(s[0]), Number(s[1]), Number(s[2])];
					if (notes[selection].type != 2) $("edit-time").value = $("edit-time2").value, notes[selection].startTimeTime = notes[selection].endTime;
					notecontrol.update();
				}
			}
		});
		$("edit-d").addEventListener("change", () => {
			if (selection.length > 0) {
				for (let i = 0; i < selection.length; i++) notes[selection[i]].above = Number($("edit-d").value);
			}
		});
		$("edit-t").addEventListener("change", () => {
			if (selection.length > 0) {
				for (let i = 0; i < selection.length; i++) notes[selection[i]].isFake = Number($("edit-t").value);
			}
		});
	}
};
// 事件管理
// ============================================================================================
var eventcontrol = {
	add: (typex, st, ed, stval = 0, edval = 0) => { // 添加事件
		let t = ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"][Math.round((typex + 675) / 337.5)];
		evs[evs_layer][t].push({
			"bezier": 0,
			"bezierPoints": [0.0, 0.0, 0.0, 0.0],
			"easingLeft": 0.0,
			"easingRight": 1.0,
			"easingType": 1,
			"end": edval,
			"endTime": ed,
			"linkgroup": 0,
			"start": stval,
			"startTime": st
		});
	},
	render: function (x1, y1, x2, y2) {
		notecontrol.render_line(x1, y1, x2, y2, 4); // 借用 notes 的程序渲染
		function draw(x, y, y2, sz /* canvas 坐标系 */, val1, val2) { // val1 是上面的数字 val2 是下面的数字
			let w = 1089 * sz;
			let gra = ctx.createLinearGradient(x, y, x, y2); // 渐变
			gra.addColorStop(0, color.evu);
			gra.addColorStop(1, color.evd);
			ctx.fillStyle = gra;
			ctx.fillRect(x - w / 2, y, w, y2 - y);
			ctx.fillStyle = color.text; // 文字颜色
			ctx.textAlign = "center";
			ctx.fillText(val1.toFixed(settingscontrol.settings.decimal), x, y + 18);
			ctx.fillText(val2.toFixed(settingscontrol.settings.decimal), x, y2 - 18);
		}
		let x = -675;
		for (let type of ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"]) {
			let ev = evs[evs_layer][type];
			for (let i = 0; i < ev.length; i++) {
				let st = -450 + hi * (ev[i].startTime[0] + ev[i].startTime[1] / ev[i].startTime[2]);
				st += rdelta;
				let ed = -450 + hi * (ev[i].endTime[0] + ev[i].endTime[1] / ev[i].endTime[2]);
				ed += rdelta;
				let f = 0;
				selection_ev.forEach((v) => {
					if (v[0] == i && v[1] == type) f = 1;
				});
				draw(x1 + (x2 - x1) * ((x + 675) / 1350), y2 - ((ed + 450) / 900) * (y2 - y1), y2 - ((st + 450) / 900) * (y2 - y1), (f ? 0.13 : 0.1), ev[i].end, ev[i].start);
			}
			x += 337.5;
		}

		if (put_ev_st != null) {
			let ed = -450 + hi * (put_ev_st[0] + put_ev_st[1] / put_ev_st[2]);
			ed += rdelta;
			draw(x1 + (x2 - x1) * ((put_ev_x + 675) / 1350), mousedata.y, y2 - ((ed + 450) / 900) * (y2 - y1), 0.1, 0, 0);
		}
	},
	check_select: (x1, y1, x2, y2) => { // 检测选中事件
		let minn = Infinity, ans, anst;
		let x = -675;
		for (let type of ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"]) {
			let ev = evs[evs_layer][type];
			for (let i = 0; i < ev.length; i++) {
				let yst = -450 + hi * (ev[i].startTime[0] + ev[i].startTime[1] / ev[i].startTime[2]);
				let yed = -450 + hi * (ev[i].endTime[0] + ev[i].endTime[1] / ev[i].endTime[2]);
				let d = notecontrol.hold_calc(x, yst, yed, x1, y1, x2, y2);
				if (d < minn) minn = d, ans = i, anst = type; // 选中音符
			}
			x += 337.5;
		}
		return minn == Infinity ? undefined : [ans, anst];
	},
	edit: () => { // 显示编辑面板
		if (selection_ev.length == 1) {
			$("edit2").style.display = "block";
			let e = evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]];
			if (selection_ev[0][1] == "speedEvents") $("edit2-ease").value = 1;
			else $("edit2-ease").value = e.easingType;
			$("event-name").innerText = selection_ev[0][1];
			$("edit2-time").value = e.startTime[0] + ":" + e.startTime[1] + "/" + e.startTime[2];
			$("edit2-time2").value = e.endTime[0] + ":" + e.endTime[1] + "/" + e.endTime[2];
			$("edit2-st").value = e.start;
			$("edit2-ed").value = e.end;
		}
	},
	hedit: () => { // 隐藏编辑面板
		$("edit2").style.display = "none";
	},
	initedit: () => { // 保存编辑面板
		$("edit2-ease").addEventListener("change", () => {
			if (selection_ev.length > 0) {
				if (isNaN(Number($("edit2-ease").value)) || ((selection_ev[0][1] == "speedEvents") && $("edit2-ease").value != "1")) $("edit-x").value = evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]].easingType;
				else {
					for (let i = 0, v = Number($("edit2-ease").value); i < selection_ev.length; i++) {
						evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]].easingType = v;
					}
				}
			}
		});
		$("edit2-time").addEventListener("change", () => {
			if (selection_ev.length == 1) {
				let e = evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]];
				let s = $("edit2-time").value.split(/[:\/]/);
				if (isBeat(s)) {
					e.startTime = [Number(s[0]), Number(s[1]), Number(s[2])];
				}
			}
		});
		$("edit2-time2").addEventListener("change", () => {
			if (selection_ev.length == 1) {
				let e = evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]];
				let s = $("edit2-time2").value.split(/[:\/]/);
				if (isBeat(s)) {
					e.endTime = [Number(s[0]), Number(s[1]), Number(s[2])];
				}
			}
		});
		$("edit2-st").addEventListener("change", () => {
			if (selection_ev.length > 0) {
				for (let i = 0; i < selection_ev.length; i++) {
					let e = evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]];
					e.start = Number($("edit2-st").value);
				}
			}
		});
		$("edit2-ed").addEventListener("change", () => {
			if (selection_ev.length > 0) {
				for (let i = 0; i < selection_ev.length; i++) {
					let e = evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]];
					e.end = Number($("edit2-ed").value);
				}
			}
		});
	},
	getval_typex: (typex, time) => { // 注意区分 typex 和 typename
		let typename = ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"][Math.round((typex + 675) / 337.5)];
		let maxt = [0, 0, 0], ans;
		evs[evs_layer][typename].forEach((e) => {
			if (cmp(e.endTime, time)) {
				if (cmp(maxt, e.startTime)) maxt = e.startTime, ans = e.end;
			}
		})
		return ans;
	}
};
// 下方设置面板管理 / 界面设置
// ============================================================================================
var settingscontrol = {
	load: () => { // js --> UI
		$("s-bpm").value = bpm;
		$("s-shu").value = shu;
		$("s-heng").value = heng;
	},
	init: () => { // UI --> js
		$("s-bpm").addEventListener('change', () => {
			if (isNaN(Number($("s-bpm").value))) $("s-bpm").value = bpm;
			else bpm = Number($("s-bpm").value);
		})
		$("s-shu").addEventListener('change', () => {
			if (isNaN(Number($("s-shu").value)) || Number($("s-shu").value) > 100) $("s-shu").value = shu;
			else shu = Number($("s-shu").value);
		})
		$("s-heng").addEventListener('change', () => {
			if (isNaN(Number($("s-heng").value)) || Number($("s-heng").value) > 100) $("s-heng").value = heng;
			else heng = Number($("s-heng").value);
		})
	},
	settings: {
		decimal: 1, // 显示事件的值时，保留几位小数
		touch_put: 0 // 移动端模式
	}
};
if (/mobile/i.test(navigator.userAgent)) settingscontrol.settings.touch_put = 1;
settingscontrol.load();
settingscontrol.init();
// 渲染
// ============================================================================================
var rdelta = 0;
var r_last_lines_length, r_last_evs_length;
function main() {
	// 填充背景	
	ctx.fillStyle = color.background;
	ctx.fillRect(0, 0, 1600, 900);

	if (playing == 1) {
		rdelta -= bpm / 60 / 60 * hi;
		// 直接渲染画面

		ctx.fillStyle = color.background2;
		ctx.fillRect(0, 0, 1600, renderer.y1);
		ctx.fillRect(0, renderer.y2, 1600, 900);
		ctx.fillRect(0, 0, renderer.x1, 900);
		ctx.fillRect(renderer.x2, 0, 1600, 900);

	} else {
		function render_text(x, y1, y2) { // 绘制小节的数字
			ctx.fillStyle = color.text; // 文字颜色
			ctx.textAlign = "start";
			for (let i = Math.floor(Math.max(-rdelta / hi, 0)); i < n; i++) {
				let y = (i * hi) - 450;
				y += rdelta;
				if (y > 500) continue;
				let ty = y2 - ((y + 450) / 900) * (y2 - y1); // 绝对坐标
				ctx.fillText(i, x, ty);
			}
		}
		// 刷新判定线列表
		if (all_data.judgeLineList.length != r_last_lines_length) {
			r_last_lines_length = all_data.judgeLineList.length;
			let v = $("lines").value;
			$("lines").innerHTML = "";
			for (let i = 0; i < all_data.judgeLineList.length; i++) {
				let op = document.createElement("option");
				op.value = i;
				op.innerText = all_data.judgeLineList[i].Name;
				$("lines").appendChild(op);
			}
			$("lines").value = (v == '' ? 0 : v);
		}
		// 刷新事件层级列表
		if (evs.length != r_last_evs_length) {
			r_last_evs_length = evs.length;
			let con = $("eventlayer-con");
			con.innerHTML = "";
			for (let i = 0; i < evs.length; i++) {
				let e = document.createElement("div");
				e.className = "eventlayer-btn";
				e.innerText = i;
				con.append(e);
				e.addEventListener("click", () => {
					evs_layer = i;
				})
			}
		}
		notecontrol.render(nrr.x1, nrr.y1, nrr.x2, nrr.y2);
		render_text(nrr.x2 + 12, nrr.y1, nrr.y2);
		if (edit_event) {
			eventcontrol.render(evrr.x1, evrr.y1, evrr.x2, evrr.y2);
			// render_text(evrr.x2 + 10, evrr.y1, evrr.y2);
		}
		// 刷新选项菜单
		if (settingscontrol.settings.touch_put) $("mode").style.display = "block";
		else $("mode").style.display = "none", mode = "computer";
	}


}
// 操作：键盘、其他
// ============================================================================================
function put_qwer(key) { // 识别 q,w,e,r 键
	// 这里专门搞一个函数出来，是为了适配手机端！
	if (key == "q") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 1);
	} else if (key == "e") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 3);
	} else if (key == "w") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 4);
	} else if (key == "r") {
		if (edit_event && mousedata.x > (nrr.x2 + evrr.x1) / 2) {
			let tmp = notecontrol.put_calc(evrr.x1, evrr.y1, evrr.x2, evrr.y2, mousedata.x, mousedata.y, 4);
			if (put_ev_st != null) {
				if (cmp(put_ev_st, tmp[1])) eventcontrol.add(put_ev_x, put_ev_st, tmp[1], eventcontrol.getval_typex(tmp[0], put_ev_st));
				put_ev_st = null;
			} else if (tmp != null) {
				put_ev_x = tmp[0], put_ev_st = tmp[1];
			}
		} else {
			let tmp = notecontrol.put_calc(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y);
			if (put_hold_st != null) {
				if (cmp(put_hold_st, tmp[1])) notecontrol.addhold(put_hold_st, tmp[1], put_hold_x)
				put_hold_st = null;
			} else if (tmp != null) {
				put_hold_x = tmp[0], put_hold_st = tmp[1];
			}
		}
	}
}
document.addEventListener('keydown', function (event) {
	if (event.key == "Control") control_down = 1;
	if (mousedata.in == 0) return;
	event.key = event.key.toLowerCase();
	console.log("按键 " + event.key + " " + event.keyCode);
	if (event.key == "q" || event.key == "e" || event.key == "w" || event.key == "r") {
		put_qwer(event.key);
	} else if (event.key == "Delete") {
		// 删除音符：
		if (selection.length > 0) {
			selection.sort((a, b) => a - b);
			for (let i = 0; i < selection.length; i++) {
				notes.splice(selection[i] - i, 1);
			}
			selection = [];
			notecontrol.update();
		}
		// 删除事件：
		for (let i = 0; i < selection_ev.length; i++) {
			evs[evs_layer][selection_ev[i][1]].splice(selection_ev[i][0], 1);
			for (let j = i + 1; j < selection_ev.length; j++) {
				if (selection_ev[i][1] == selection_ev[j][1]) selection_ev[j][0]--;
			}
		}
		selection_ev = [];
	} else if (event.key == " ") {
		playing ^= 1;
		if (playing == 1) renderer.sort();
	}
});
document.addEventListener('keyup', function (event) {
	if (event.key == "Control") control_down = 0;
});

$("lines").addEventListener('change', () => {
	notes = all_data.judgeLineList[$("lines").value].notes;
	notecontrol.update();
	evs = all_data.judgeLineList[$("lines").value].eventLayers;
	selection = [];
});
// 操作：鼠标、触摸
// ============================================================================================
$("eventlayer-add").addEventListener("click", () => { // 添加事件层级
	evs.push({
		"alphaEvents": [],
		"moveXEvents": [],
		"moveYEvents": [],
		"rotateEvents": [],
		"speedEvents": []
	})
})
$("eventlayer-del").addEventListener("click", () => { // 添加事件层级
	if (evs.length > 1) {
		let e = evs[evs.length - 1];
		let cnt = e.alphaEvents.length + e.moveXEvents.length + e.moveYEvents.length + e.rotateEvents.length + e.speedEvents.length;
		if (cnt == 0 || "yes" == window.prompt("最后一个事件层级已经有事件了，是否强制删除？是输入 yes")) evs.pop();
	}
})
$("m-addline").addEventListener('click', () => {
	all_data.judgeLineList.push(new_judge_line());
	window.alert("添加成功")
});
$("m-changename").addEventListener('click', () => {
	all_data.judgeLineList[$("lines").value].Name = window.prompt();
	r_last_lines_length = -1; // 强制刷新判定线列表
});
$("m-event").addEventListener('click', () => {
	if (edit_event == 1) {
		edit_event = 0;
		nrr.x2 = 1500;
	} else {
		edit_event = 1;
		nrr.x2 = 750;
	}
});
$("m-touch").addEventListener('click', () => {
	if (settingscontrol.settings.touch_put == 1) {
		settingscontrol.settings.touch_put = 0;
		mode = "computer";
	} else {
		settingscontrol.settings.touch_put = 1;
	}
});

notecontrol.initedit();
eventcontrol.initedit();
document.addEventListener('wheel', (e) => {
	rdelta += e.deltaY;
	if (rdelta > 100) rdelta = 100;
});
var mousedata = { in: 0, x: 0, y: 0, down: 0 }; // canvas 坐标系
$("cvs").addEventListener("mousemove", function (event) {
	const rect = $("cvs").getBoundingClientRect(); // 计算鼠标相对于 canvas 内部的坐标，考虑缩放
	mousedata.x = (event.clientX - rect.left) * $("cvs").width / rect.width;
	mousedata.y = (event.clientY - rect.top) * $("cvs").height / rect.height;
	mousedata.in = 1;
	if (mousedata.drag != null) { // 拖动普通音符
		let s = notecontrol.put_calc(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y);
		if (s[0] != notes[mousedata.drag].positionX || !cmparray(s[1], notes[mousedata.drag].startTime)) {
			notes[mousedata.drag].positionX = s[0];
			notes[mousedata.drag].startTime = s[1];
			notes[mousedata.drag].endTime = s[1];
			notecontrol.update();
		}
	}
});
$("cvs").addEventListener("mouseout", function (event) {
	mousedata.in = 0;
});
$("cvs").addEventListener("mousedown", () => {
	mousedata.down = 1;
	mousedata.drag = null;
	if (mousedata.x < (nrr.x2 + evrr.x1) / 2) { // 点击到音符区域
		let p = notecontrol.check_select(nrr.x1, nrr.y1, nrr.x2, nrr.y2);
		if (notes[p].type != 2) {
			mousedata.drag = p;
			console.log(mousedata.drag);
		}
	}
});
document.addEventListener("mouseup", () => {
	mousedata.down = 0;
	mousedata.drag = null;
});

// 移动设备的滑动
let delta = 0;
document.addEventListener('touchstart', function (e) {
	delta = e.touches[0].clientY;
}, { passive: false });
document.addEventListener('touchmove', function (e) {
	e.preventDefault();
	let currentDelta = e.touches[0].clientY;
	let distance = currentDelta - delta;
	delta = currentDelta;
	rdelta -= distance;
	if (rdelta > 100) rdelta = 100;
}, { passive: false });

$("cvs").addEventListener('click', function () {
	if (edit_event && mousedata.x > (nrr.x2 + evrr.x1) / 2) { // 点击到事件区域
		let p = eventcontrol.check_select(evrr.x1, evrr.y1, evrr.x2, evrr.y2);
		if (p == undefined) return;
		selection = [];
		if (control_down == 0) {
			if (selection_ev.length == 1 && cmparray(selection_ev[0], p)) selection_ev = [], notecontrol.hedit();
			else selection_ev = [p], eventcontrol.edit(), notecontrol.hedit();
		} else {
			if (selection_ev.includes(p)) {
				selection_ev.splice(selection.indexOf(p), 1);
				if (selection_ev.length == 0) eventcontrol.hedit();
			}
			else selection_ev.push(p);
		}
	} else { // 点击到音符区域
		if (mode == "computer") {
			let p = notecontrol.check_select(nrr.x1, nrr.y1, nrr.x2, nrr.y2);
			if (p == undefined) return;
			selection_ev = [];
			if (control_down == 0) {
				if (selection[0] == p && selection.length == 1) selection = [], notecontrol.hedit();
				else selection = [p], notecontrol.edit(), eventcontrol.hedit();
			} else {
				if (selection.includes(p)) {
					selection.splice(selection.indexOf(p), 1);
					if (selection.length == 0) notecontrol.hedit();
				}
				else selection.push(p);
			}
		} else {
			put_qwer(mode);
		}
	}
});
for (let i = 0; i <= 4; i++) {
	$("mode").children[i].addEventListener('click', () => {
		mode = ["computer", "q", "w", "e", "r"][i];
		if (i == 0) put_hold_st = null; // 停止放置长条
	});
}
$("fillnotes-open").addEventListener('click', () => {
	$('window').style.display = 'flex';
	if (selection.length == 1) {
		$("fillnotes-time").value = notes[selection[0]].startTime[0] + ":" + notes[selection[0]].startTime[1] + "/" + notes[selection[0]].startTime[2];
		$("fillnotes-x").value = notes[selection[0]].positionX;
		$("fillnotes-flag").checked = 0;
	}
	if (selection.length == 2) {
		if (cmp2(notes[selection[0]].startTime, notes[selection[1]].startTime)) {
			$("fillnotes-time").value = notes[selection[0]].startTime[0] + ":" + notes[selection[0]].startTime[1] + "/" + notes[selection[0]].startTime[2];
			$("fillnotes-x").value = notes[selection[0]].positionX;
			$("fillnotes-time2").value = notes[selection[1]].startTime[0] + ":" + notes[selection[1]].startTime[1] + "/" + notes[selection[1]].startTime[2];
			$("fillnotes-x2").value = notes[selection[1]].positionX;
		} else {
			$("fillnotes-time").value = notes[selection[1]].startTime[0] + ":" + notes[selection[1]].startTime[1] + "/" + notes[selection[1]].startTime[2];
			$("fillnotes-x").value = notes[selection[1]].positionX;
			$("fillnotes-time2").value = notes[selection[0]].startTime[0] + ":" + notes[selection[0]].startTime[1] + "/" + notes[selection[0]].startTime[2];
			$("fillnotes-x2").value = notes[selection[0]].positionX;
		}
	}
});
$("fillnotes").addEventListener('click', () => {
	// st 填充到 ed，每次增加 density
	let st = $("fillnotes-time").value.split(/[:\/]/);
	if (!isBeat(st)) return;
	st = [Number(st[0]), Number(st[1]), Number(st[2])];
	let ed = $("fillnotes-time2").value.split(/[:\/]/);
	if (!isBeat(ed)) return;
	ed = [Number(ed[0]), Number(ed[1]), Number(ed[2])];
	let density = $("fillnotes-density").value.split(/[:\/]/);;
	if (!isBeat(density)) return;
	density = [Number(density[0]), Number(density[1]), Number(density[2])];

	// x 坐标的区间
	let x = parseFloat($("fillnotes-x").value), x2 = parseFloat($("fillnotes-x2").value);
	if (isNaN(x) || isNaN(x2)) return;

	let t = parseInt($("fillnotes-t").value);
	let ease = $("fillnotes-ease").value;

	if ($("fillnotes-flag").checked) { // 包含边界？
		for (let i = st; cmp(i, ed); i = add(i, density))
			notecontrol.add(t, i, x == x2 ? x : x + (x2 - x) * calcease(ease, div(sub(i, st), sub(ed, st))), 0);
	} else {
		for (let i = add(st, density); cmp2(i, ed); i = add(i, density))
			notecontrol.add(t, i, x == x2 ? x : x + (x2 - x) * calcease(ease, div(sub(i, st), sub(ed, st))), 0);
	}

	notecontrol.update();
});


setInterval(main, 1000 / 60); // 60 帧