// 主题色
const color = {
	"line": "#9fff95CC",
	"background": "#000",
	"background2": "#222",
	"text": "#FFF",
	"evu": "#ffef5b96",
	"evd": "#11fbbf96",
	"select_rect": "#a2fffd60"
}
// 全局变量 / 数据管理
// ============================================================================================
window.$ = (e) => {
	return document.getElementById(e);
}
var mode = "computer";
window.onbeforeunload = () => { return 1 };
/*
mode 变量详解
"computer": 正常的电脑操作，按下键盘，在鼠标的位置放音符
"q": 手机操作，点击屏幕时放下 Tap（"w""e" 同理）
"r": 手机操作，滑动屏幕时放下 Hold
*/
var playing = 0, playermode;
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
var edit_event = 0; // 是否编辑事件
var in_download = 0; // 下载中？
var lineid_select = 0; // 选中的判定线
var nrr = { // notes render rect
	x1: 100, y1: 0, x2: 1500, y2: 900
}
var evrr = { // events render rect
	x1: 850, y1: 0, x2: 1500, y2: 900
}
var all_data = new_empty_data();
var notes = null; // 当前判定线的音符
for (let i = 0; i < 5; i++) all_data.judgeLineList.push(new_judge_line());
var evs = null; // 当前判定线的事件
var now_line = null; // 当前判定线
var evs_layer = 0; // 选中的事件层级
var bpm = all_data.BPMList;
function cmparray(a, b) {
	// Array.isArray(a) && Array.isArray(b) && 
	return a.length == b.length && a.every((v, i) => v == b[i]);
}
now_line = all_data.judgeLineList[0];
evs = now_line.eventLayers;
notes = now_line.notes;
function change_line(i) {
	$("line-selected").innerHTML = $("lines").children[i].innerHTML;
	now_line = all_data.judgeLineList[i];
	evs = now_line.eventLayers;
	notes = now_line.notes;
	notecontrol.update();
	selection = [];
	sidebarcontrol.edit_update();
}
// 音符管理
// ============================================================================================
var notecontrol = {
	/*
	本模块不使用 nrr 变量，需要手动传入渲染的矩形范围，这样更灵活
	*/
	add: function (type, time, x, auto_update = 1) { // 注意：调用此函数会自动更新渲染缓存，除非更改参数 auto_update
		/*
		type: 1tap 2hold 3flick 4drag
		*/
		notes.push(note_compress({
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
		}));
		if (auto_update) this.update();
	},
	addhold: function (st, ed, x, auto_update = 1) { // 注意：调用此函数会自动更新渲染缓存，除非更改参数 auto_update
		/*
		type: 1tap 2hold 3flick 4drag
		*/
		notes.push(note_compress({
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
		}));
		if (auto_update) this.update();
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

		if (notes == null) return;

		var mp = new Map(), mp2 = new Map();
		for (let i = 0; i < notes.length; i++) {
			let note = note_extract(notes[i]);
			let y = -450 + hi * (note.startTime[0] + note.startTime[1] / note.startTime[2]);
			let h = (note.positionX / 5).toFixed(0) * 10000 + (y / 5).toFixed(0);
			if (note.type == 2) {
				let y2 = (note.type == 2) ? -450 + hi * (note.endTime[0] + note.endTime[1] / note.endTime[2]) : y;
				this.render_cache.push({
					"x": note.positionX,
					"y": y,
					"y2": y2,
					"ang": 0,
					"t": note.type,
					"id": i
				});
			} else {
				let t = (mp.get(h) ?? 0);
				if (t < 10) { // 堆叠过多时不显示
					this.render_cache.push({
						"x": note.positionX,
						"y": y,
						"ang": t * 25 * Math.PI / 180,
						"t": note.type,
						"id": i
					});
				}
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
				let y = this.render_cache[i].y + rdelta;
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
		// 返回一个数组，里面包含了：x 坐标和时间（带分数）
	},
	put: function (x1, y1, x2, y2, tx, ty, type) {
		let add_tmp = this.put_calc(x1, y1, x2, y2, tx, ty);
		if (add_tmp != undefined) this.add(type, add_tmp[1], add_tmp[0]);
	},
	hold_calc: (x, yst, yed, x1, y1, x2, y2) => { // 坐标 x，时间范围 (yst-yed)，渲染区间 (x1,y1) 到 (x2,y2)，求出到鼠标的距离的平方
		yst += rdelta;
		yed += rdelta;
		let tx = x1 + (x2 - x1) * ((x + 675) / 1350);
		// 长条下面的 y（开始触发），上面的 y（结束触发），tyst > tyed
		let tyst = y2 - ((yst + 450) / 900) * (y2 - y1), tyed = y2 - ((yed + 450) / 900) * (y2 - y1);
		let dis = 0;
		if (mousedata.y > tyed && mousedata.y < tyst) {
			dis = (tx - mousedata.x) * (tx - mousedata.x);
		} else if (mousedata.y < tyed) {
			dis = (tx - mousedata.x) * (tx - mousedata.x) + 4 * (tyed - mousedata.y) * (tyed - mousedata.y);
		} else {
			dis = (tx - mousedata.x) * (tx - mousedata.x) + 4 * (tyst - mousedata.y) * (tyst - mousedata.y);
		}
		return dis;
	},
	check_select: function (x1, y1, x2, y2, minn = Infinity) {
		if (notes == undefined) return undefined;
		let ans;
		// 这里所有的距离都是平方过后的，因为 sqrt 比较麻烦
		minn *= minn;
		for (let i = 0; i < notes.length; i++) {
			let note = note_extract(notes[i]);
			if (note.type == 2) continue;
			let y = -450 + hi * (note.startTime[0] + note.startTime[1] / note.startTime[2]);
			y += rdelta;
			let tx = x1 + (x2 - x1) * ((note.positionX + 675) / 1350);
			let ty = y2 - ((y + 450) / 900) * (y2 - y1);
			let dis = (tx - mousedata.x) * (tx - mousedata.x) + 4 * (ty - mousedata.y) * (ty - mousedata.y)
			if (dis < minn) minn = dis, ans = i; // 选中音符
		}
		if (minn > 6000) {
			for (let i = 0; i < notes.length; i++) {
				let note = note_extract(notes[i]);
				if (note.type != 2) continue;
				let yst = -450 + hi * (note.startTime[0] + note.startTime[1] / note.startTime[2]);
				let yed = -450 + hi * (note.endTime[0] + note.endTime[1] / note.endTime[2]);
				let dis = this.hold_calc(note.positionX, yst, yed, x1, y1, x2, y2);
				if (dis < minn) minn = dis, ans = i; // 选中音符
			}
		}
		return ans;
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
	ex_add: (typex, st, ed, stval = 0, edval = 0) => { // 添加扩展事件
		let t = ["scaleXEvents", "scaleYEvents", "colorEvents", "textEvents", "inclineEvents", "paintEvents"][Math.round((typex + 675) / 270)];
		if (now_line.extended[t] == null) now_line.extended[t] = [];
		now_line.extended[t].push({
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
		function draw(x, y, y2, sz /* canvas 坐标系 */, val1, val2) { // val1 是上面的数字 val2 是下面的数字
			if (y2 < -50 || y > 950) return;
			let w = 1089 * sz;
			let gra = ctx.createLinearGradient(x, y, x, y2); // 渐变
			gra.addColorStop(0, color.evu);
			gra.addColorStop(1, color.evd);
			ctx.fillStyle = gra;
			ctx.fillRect(x - w / 2, y, w, y2 - y);
			ctx.fillStyle = color.text; // 文字颜色
			ctx.textAlign = "center";
			// console.log(val1, val2);
			if (val1 != null) ctx.fillText(val1.toFixed(settingscontrol.settings.decimal), x, y + 18);
			if (val2 != null) ctx.fillText(val2.toFixed(settingscontrol.settings.decimal), x, y2 - 18);
		}
		let x = -675;
		let all_evs_list;
		if (evs_layer == "ex") all_evs_list = ["scaleXEvents", "scaleYEvents", "colorEvents", "textEvents", "inclineEvents", "paintEvents"];
		else all_evs_list = ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"];
		notecontrol.render_line(x1, y1, x2, y2, all_evs_list.length - 1); // 借用 notes 的程序渲染
		for (let type of all_evs_list) {
			let ev = (evs_layer == "ex" ? now_line.extended : evs[evs_layer])[type];
			if (ev == null) {
				x += 270;
				continue; // 某些扩展事件可能不存在，直接跳过
			}
			for (let i = 0; i < ev.length; i++) {
				let st = -450 + hi * (ev[i].startTime[0] + ev[i].startTime[1] / ev[i].startTime[2]);
				st += rdelta;
				let ed = -450 + hi * (ev[i].endTime[0] + ev[i].endTime[1] / ev[i].endTime[2]);
				ed += rdelta;
				let f = 0;
				selection_ev.forEach((v) => {
					if (v[0] == i && v[1] == type) f = 1;
				});
				// console.log(type);
				if (type == "colorEvents") draw(x1 + (x2 - x1) * ((x + 675) / 1350), y2 - ((ed + 450) / 900) * (y2 - y1), y2 - ((st + 450) / 900) * (y2 - y1), (f ? 0.13 : 0.1), ev[i].end[0] * 65536 + ev[i].end[1] * 256 + ev[i].end[2], ev[i].start[0] * 65536 + ev[i].start[1] * 256 + ev[i].start[2]);
				else if (type == "textEvents") draw(x1 + (x2 - x1) * ((x + 675) / 1350), y2 - ((ed + 450) / 900) * (y2 - y1), y2 - ((st + 450) / 900) * (y2 - y1), (f ? 0.13 : 0.1), null, null);
				else draw(x1 + (x2 - x1) * ((x + 675) / 1350), y2 - ((ed + 450) / 900) * (y2 - y1), y2 - ((st + 450) / 900) * (y2 - y1), (f ? 0.13 : 0.1), ev[i].end, ev[i].start);
			}
			x += 1350 / (all_evs_list.length - 1);
		}
		if (put_ev_st != null) {
			let ed = -450 + hi * (put_ev_st[0] + put_ev_st[1] / put_ev_st[2]);
			ed += rdelta;
			draw(x1 + (x2 - x1) * ((put_ev_x + 675) / 1350), mousedata.y, y2 - ((ed + 450) / 900) * (y2 - y1), 0.1, null, null);
		}
	},
	check_select: (x1, y1, x2, y2) => { // 检测选中事件
		let minn = Infinity, ans, anst;
		let x = -675;
		let all_evs_list;
		if (evs_layer == "ex") all_evs_list = ["scaleXEvents", "scaleYEvents", "colorEvents", "textEvents", "inclineEvents", "paintEvents"];
		else all_evs_list = ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"];
		for (let type of all_evs_list) {
			let ev = (evs_layer == "ex" ? now_line.extended : evs[evs_layer])[type];
			if (ev == null) {
				x += 270;
				continue; // 某些扩展事件可能不存在，直接跳过
			}
			for (let i = 0; i < ev.length; i++) {
				let yst = -450 + hi * (ev[i].startTime[0] + ev[i].startTime[1] / ev[i].startTime[2]);
				let yed = -450 + hi * (ev[i].endTime[0] + ev[i].endTime[1] / ev[i].endTime[2]);
				let d = notecontrol.hold_calc(x, yst, yed, x1, y1, x2, y2);
				if (d < minn) minn = d, ans = i, anst = type; // 选中音符
			}
			x += 1350 / (all_evs_list.length - 1);
		}
		return minn == Infinity ? undefined : [ans, anst];
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
	},
	ex_getval_typex: (typex, time) => { // 注意区分 typex 和 typename
		let typename = ["scaleXEvents", "scaleYEvents", "colorEvents", "textEvents", "inclineEvents", "paintEvents"][Math.round((typex + 675) / 270)];
		let maxt = [0, 0, 0], ans;
		if (now_line.extended[typename] == null) {
			if (typename == "colorEvents") return [255, 255, 255];
			if (typename == "textEvents") return "";
			else return 0;
		}
		now_line.extended[typename].forEach((e) => {
			if (cmp(e.endTime, time)) {
				if (cmp(maxt, e.startTime)) maxt = e.startTime, ans = e.end;
			}
		})
		return ans;
	}
};
// 右侧设置面板管理
// ============================================================================================
var sidebarcontrol = {
	initedit: () => { // 保存编辑面板
		// 初始化页面的事件监听（addEventListener）
		// edit
		$("edit-x").addEventListener("change", () => {
			if (selection.length > 0) {
				let tmp = Number($("edit-x").value);
				if (isNaN(tmp)) $("edit-x").value = notes[selection][0].positionX;
				else {
					for (let i = 0; i < selection.length; i++) {
						let note = note_extract(notes[selection[i]]);
						note.positionX = tmp;
						notes[selection[i]] = note_compress(note);
					}
					notecontrol.update();
				}
			}
		});
		$("edit-y").addEventListener("change", () => {
			if (selection.length > 0) {
				let tmp = Number($("edit-y").value);
				if (isNaN(tmp)) $("edit-y").value = notes[selection][0].yOffset;
				else {
					for (let i = 0; i < selection.length; i++) {
						let note = note_extract(notes[selection[i]]);
						note.yOffset = tmp;
						notes[selection[i]] = note_compress(note);
					}
				}
			}
		});
		$("edit-time").addEventListener("change", () => {
			if (selection.length == 1) {
				let s = $("edit-time").value.split(/[:\/]/);
				if (is_beat(s)) {
					let note = note_extract(notes[selection[0]]);
					note.startTime = [Number(s[0]), Number(s[1]), Number(s[2])];
					if (note != 2) {
						$("edit-time2").value = $("edit-time").value, note.endTime = note.startTime;
					}
					notes[selection[0]] = note_compress(note);
					notecontrol.update();
				}
			}
		});
		$("edit-time2").addEventListener("change", () => {
			if (selection.length == 1) {
				let s = $("edit-time").value.split(/[:\/]/);
				if (t(s)) {
					let note = note_extract(notes[selection[0]]);
					note.startTime = [Number(s[0]), Number(s[1]), Number(s[2])];
					if (note != 2) {
						$("edit-time").value = $("edit-time2").value, note.startTime = note.endTime;
					}
					notes[selection[0]] = note_compress(note);
					notecontrol.update();
				}
			}
		});
		$("edit-d").addEventListener("change", () => {
			if (selection.length > 0) {
				for (let i = 0; i < selection.length; i++) {
					let note = note_extract(notes[selection[i]]);
					note.above = Number($("edit-d").value);
					notes[selection[i]] = note_compress(note);
				}
			}
		});
		$("edit-t").addEventListener("change", () => {
			if (selection.length > 0) {
				for (let i = 0; i < selection.length; i++) {
					let note = note_extract(notes[selection[i]]);
					note.isFake = Number($("edit-t").value);
					notes[selection[i]] = note_compress(note);
				}
			}
		});
		$("edit-visibleTime").addEventListener("change", () => {
			if (selection.length > 0) {
				let v = Number($("edit-visibleTime").value);
				if (isNaN(v)) return;
				for (let i = 0; i < selection.length; i++) {
					let note = note_extract(notes[selection[i]]);
					note.visibleTime = v;
					notes[selection[i]] = note_compress(note);
				}
			}
		});
		// edit2
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
				let e = (evs_layer == "ex" ? now_line.extended : evs[evs_layer])[selection_ev[0][1]][selection_ev[0][0]]; let s = $("edit2-time").value.split(/[:\/]/);
				if (is_beat(s)) {
					e.startTime = [Number(s[0]), Number(s[1]), Number(s[2])];
				}
			}
		});
		$("edit2-time2").addEventListener("change", () => {
			if (selection_ev.length == 1) {
				let e = (evs_layer == "ex" ? now_line.extended : evs[evs_layer])[selection_ev[0][1]][selection_ev[0][0]]; let s = $("edit2-time2").value.split(/[:\/]/);
				if (is_beat(s)) {
					e.endTime = [Number(s[0]), Number(s[1]), Number(s[2])];
				}
			}
		});
		function check_val(data, type) { // 传入文本框的原始数据，根据事件类型自动转换
			if (type == "colorEvents") {
				let tmp = data.split(",");
				if (tmp.length == 3 && tmp.every((v) => { return !isNaN(Number(v)) })) return [Number(tmp[0]), Number(tmp[1]), Number(tmp[2])];
				else return null;
			} else if (type == "textEvents") {
				return data;
			} else {
				if (!isNaN(Number(data))) return Number(data);
				else return null;
			}
		}
		$("edit2-st").addEventListener("change", () => {
			if (selection_ev.length > 0) {
				for (let i = 0; i < selection_ev.length; i++) {
					let e = (evs_layer == "ex" ? now_line.extended : evs[evs_layer])[selection_ev[i][1]][selection_ev[i][0]];
					let t = check_val($("edit2-st").value, selection_ev[i][1]);
					if (t != null) e.start = t;
				}
			}
		});
		$("edit2-ed").addEventListener("change", () => {
			if (selection_ev.length > 0) {
				for (let i = 0; i < selection_ev.length; i++) {
					let e = (evs_layer == "ex" ? now_line.extended : evs[evs_layer])[selection_ev[i][1]][selection_ev[i][0]];
					let t = check_val($("edit2-ed").value, selection_ev[i][1]);
					if (t != null) e.end = t;
				}
			}
		});
		$("edit3-name").addEventListener("change", () => {
			now_line.Name = $("edit3-name").value;
			r_last_lines_length = -1; // 强制刷新判定线列表
		});
		$("edit3-fa").addEventListener("change", () => {
			let v = $("edit3-fa").value;
			v = Math.floor(v); // 取整
			$("edit3-fa").value = v;
			if (v >= -1 && v < all_data.judgeLineList.length) {
				now_line.father = v;
			} else {
				$("edit3-fa").value = now_line.father;
			}
		});
		$("edit3-bpmfactor").addEventListener("change", () => {
			let v = Number($("edit3-bpmfactor").value);
			if (v >= 0 && !isNaN(v)) {
				now_line.bpmfactor = v;
			} else {
				$("edit3-bpmfactor").value = now_line.bpmfactor;
			}
		});
		$("edit4-impl").addEventListener("click", () => {
			let t = $("edit4-t").value;
			let v1 = Number($("edit4-v1").value);
			let v2 = Number($("edit4-v2").value);
			let ease = $("edit4-ease").value;
			let op = $("edit4-op").value;
			let cycle = $("edit4-cycle").value.trim().split(" ");
			let rand = Number($("edit4-rand").value);
			if (isNaN(v1) || isNaN(v2)) return;
			if (isNaN(rand)) rand = 0;
			selection.sort((a, b) => {
				return cmp(note_extract(notes[a]).startTime, note_extract(notes[b]).startTime) ? -1 : 1;
			});
			if (t == "line") {
				if (op == "set") {
					for (let i = 0; i < selection.length; i++) {
						let v = v1 + (v2 - v1) * calcease(ease, i / (selection.length - 1));
						v = Math.floor(v);
						if(v<0) v=0;
						if(v>=all_data.judgeLineList.length) v=all_data.judgeLineList.length-1;
						all_data.judgeLineList[v].notes.push(notes[selection[i]]);
					}
					delete_selection();
				}
			} else {
				for (let i = 0; i < selection.length; i++) {
					let v = v1 + (v2 - v1) * calcease(ease, i / (selection.length - 1));
					if (!isNaN(Number(cycle[i % cycle.length]))) v *= cycle[i % cycle.length];
					let note = note_extract(notes[selection[i]]);
					switch (op) {
						case "add": note[t] += v; break;
						case "set": note[t] = v; break;
						case "mul": note[t] *= v; break;
						case "max": note[t] = Math.max(note[t], v); break;
						case "min": note[t] = Math.min(note[t], v); break;
						case "flip": note[t] = 2 * v - note[t]; break;
					}
					note[t] += (Math.random() * 2 - 1) * rand;
					notes[selection[i]] = note_compress(note);
				}
			}
			notecontrol.update();
		});

		sidebarcontrol.edit_update();
	},
	edit_update: () => {
		function show(i) {
			$("edit" + (i == 1 ? "" : i)).style.display = "block";
			for (let j = 1; j <= 4; j++)
				if (i != j) $("edit" + (j == 1 ? "" : j)).style.display = "none";
		}
		if (selection.length == 1) {
			show(1);
			let note = note_extract(notes[selection[0]]);
			$("edit-x").value = note.positionX;
			$("edit-y").value = note.yOffset;
			$("edit-time").value = note.startTime[0] + ":" + note.startTime[1] + "/" + note.startTime[2];
			$("edit-time2").value = note.endTime[0] + ":" + note.endTime[1] + "/" + note.endTime[2];
			$("edit-d").value = note.above;
			$("edit-t").value = note.isFake;
			$("edit-visibleTime").value = note.visibleTime;
		} else if (selection_ev.length == 1) {
			show(2);
			if (evs_layer == "ex") var e = now_line.extended[selection_ev[0][1]][selection_ev[0][0]];
			else var e = evs[evs_layer][selection_ev[0][1]][selection_ev[0][0]];
			if (selection_ev[0][1] == "speedEvents") $("edit2-ease").value = 1;
			else $("edit2-ease").value = e.easingType;
			$("event-name").innerText = selection_ev[0][1];
			$("edit2-time").value = e.startTime[0] + ":" + e.startTime[1] + "/" + e.startTime[2];
			$("edit2-time2").value = e.endTime[0] + ":" + e.endTime[1] + "/" + e.endTime[2];
			$("edit2-st").value = e.start;
			$("edit2-ed").value = e.end;
		} else if (selection.length > 1) {
			show(4);
		} else {
			show(3);
			if (now_line != undefined) {
				$("edit3-name").value = now_line.Name;
				$("edit3-fa").value = now_line.father;
				$("edit3-bpmfactor").value = now_line.bpmfactor;
			}
		}
	}
}
// 下方设置面板管理 / 界面设置
// ============================================================================================
var settingscontrol = {
	load: () => { // js --> UI
		$("s-shu").value = shu;
		$("s-heng").value = heng;
		if (bpm.length > 1) $("s-bpm").innerText = "混合"
		else $("s-bpm").innerText = bpm[0].bpm;

		$("bpmlist").innerHTML = "";
		for (let i = 0; i < bpm.length; i++) {
			let div = document.createElement("div");
			div.className = "bpmlist-show";

			div.appendChild(document.createTextNode("bpm: "));

			let e = document.createElement("input");
			e.value = bpm[i].bpm;
			e.style.marginRight = "5px";
			e.addEventListener("change", (arg) => {
				console.log(e.value, e, arg);
				if (isNaN(Number(e.value))) e.value = bpm[i].bpm;
				else bpm[i].bpm = Number(e.value);
				settingscontrol.load();
			});
			div.appendChild(e);

			div.appendChild(document.createTextNode("开始时间: "));

			let e2 = document.createElement("input");
			e2.value = bpm[i].startTime[0] + ":" + bpm[i].startTime[1] + "/" + bpm[i].startTime[2];
			e2.addEventListener("change", () => {
				let s = e2.value.split(/[:\/]/);
				if (is_beat(s)) bpm[i].startTime = [Number(s[0]), Number(s[1]), Number(s[2])];
				else e2.value = bpm[i].startTime[0] + ":" + bpm[i].startTime[1] + "/" + bpm[i].startTime[2];
			});
			div.appendChild(e2);

			let e3 = document.createElement("button");
			e3.innerHTML = "&times;";
			e3.addEventListener("click", () => {
				if (bpm.length > 1) {
					bpm.splice(i, 1);
					settingscontrol.load();
				}
			});
			div.appendChild(e3);

			$("bpmlist").appendChild(div);
		}
	},
	init: () => { // UI --> js
		$("s-shu").addEventListener('change', () => {
			if (isNaN(Number($("s-shu").value)) || Number($("s-shu").value) > 100) $("s-shu").value = shu;
			else shu = Number($("s-shu").value);
		})
		$("s-heng").addEventListener('change', () => {
			if (isNaN(Number($("s-heng").value)) || Number($("s-heng").value) > 100) $("s-heng").value = heng;
			else heng = Number($("s-heng").value);
		})
		$("s-bpm").addEventListener('click', () => {
			$("window-bpmlist").style.display = 'flex';
		});
		$("bpmlist-add").addEventListener('click', () => {
			bpm.push({ "startTime": bpm[bpm.length - 1].startTime, "bpm": bpm[bpm.length - 1].bpm })
			settingscontrol.load();
		});
	},
	settings: {
		decimal: 1, // 显示事件的值时，保留几位小数
		touch_put: 0, // 移动端模式
		player: 1 // 播放器
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
		playercontrol.updateTime();
		// 直接渲染画面
		renderer.main([Math.floor(-rdelta / hi), -rdelta % hi, hi], 1);

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
		if (settingscontrol.settings.touch_put) $("mode").style.display = "flex";
		else $("mode").style.display = "none", mode = "computer";

		// 渲染画面（半透明）
		if (settingscontrol.settings.player == 1) {
			ctx.globalAlpha = 0.4;
			renderer.pre();
			if (renderer) renderer.main([Math.floor(-rdelta / hi), -rdelta % hi, hi]);
			ctx.globalAlpha = 1;
		}

		// 渲染选择框
		if (mousedata.sel_rect.x1 != null) {
			ctx.fillStyle = color.select_rect;
			let y1 = nrr.y2 - (mousedata.sel_rect.y1 * hi + rdelta);
			ctx.fillRect(mousedata.sel_rect.x1, y1, mousedata.x - mousedata.sel_rect.x1, mousedata.y - y1);
		}
	}

	// 刷新判定线列表
	if (all_data.judgeLineList.length != r_last_lines_length) {
		r_last_lines_length = all_data.judgeLineList.length;
		let v = $("lines").value;
		$("lines").innerHTML = "";
		for (let i = 0; i < all_data.judgeLineList.length; i++) {
			let op = document.createElement("li");
			op.innerHTML =
				`<div class="option-judgeline" data-i="${i}">
					[${i}]
					<span class="option-judgeline-name">${all_data.judgeLineList[i].Name}</span>
					<br>
					<span class="option-judgeline-pos"></span>
					<span class="option-judgeline-deg"></span>
					<span class="option-judgeline-n"></span>
				</div>
			`;
			op.addEventListener("click", () => {
				lineid_select = i;
				change_line(lineid_select);
				$("lines").style.display = "none";
			})
			$("lines").appendChild(op);
		}
		$("lines").value = (v == '' ? 0 : v);
	}
	if ($("line-selected").innerText == "") change_line(lineid_select);
	let nodes = document.getElementsByClassName("option-judgeline-name");
	for (let i = 0; i < nodes.length; i++) {
		let id = nodes[i].parentNode.dataset.i;
		nodes[i].innerText = all_data.judgeLineList[id].Name;
	}
	nodes = document.getElementsByClassName("option-judgeline-pos");
	for (let i = 0; i < nodes.length; i++) {
		let id = nodes[i].parentNode.dataset.i;
		nodes[i].innerText = "(" + renderer.getval(all_data.judgeLineList[id], "moveXEvents", -rdelta / hi).toFixed(0) + "," + renderer.getval(all_data.judgeLineList[id], "moveYEvents", -rdelta / hi).toFixed(0) + ")";
	}
	nodes = document.getElementsByClassName("option-judgeline-deg");
	for (let i = 0; i < nodes.length; i++) {
		let id = nodes[i].parentNode.dataset.i;
		nodes[i].innerText = renderer.getval(all_data.judgeLineList[id], "rotateEvents", -rdelta / hi).toFixed(0);
	}
	nodes = document.getElementsByClassName("option-judgeline-n");
	for (let i = 0; i < nodes.length; i++) {
		let id = nodes[i].parentNode.dataset.i;
		nodes[i].innerText = all_data.judgeLineList[id].notes.length;
	}
}
// 播放功能
// ============================================================================================
var playercontrol = {
	startTime: null, // 单位：毫秒
	startChartTime: null, // 单位：秒
	play: function () {
		renderer.pre();
		let musicplayer = $("music-player");
		if (musicplayer.src == "") {
			playing = 1;
			this.startChartTime = beat_to_sec(-rdelta / hi);
			this.startTime = performance.now();
		} else {
			musicplayer.currentTime = beat_to_sec(-rdelta / hi);
			musicplayer.play().then(() => {
				this.startChartTime = beat_to_sec(-rdelta / hi);
				this.startTime = performance.now();
				// console.log(this.startTime, rdelta, this.startChartTime);
				playing = 1;
			});
		}
	}, pause: function () {
		playing = 0;
		let musicplayer = $("music-player");
		musicplayer.pause();
	}, change: function () {
		if (playing == 0) this.play();
		else this.pause();
	}, updateTime: function () {
		rdelta = -hi * sec_to_beat(this.startChartTime + (performance.now() - this.startTime) / 1000);
	}
}
// 复制粘贴
// ============================================================================================
var clipboardcontrol = {
	copy_mode: "inner",
	cache: "",
	copy_str: function (data) {
		if (this.copy_mode == "inner") cache = data;
		else navigator.clipboard.writeText(data);
	},
	copy: function () {
		if (selection.length > 0) {
			let arr = [];
			for (let i = 0; i < selection.length; i++) arr.push(note_extract(notes[selection[i]]));
			this.copy_str(JSON.stringify(arr));
		} else {
			let arr = [];
			for (let i = 0; i < selection_ev.length; i++)
				arr.push([selection_ev[i][1], evs[evs_layer][selection_ev[i][1]][[selection_ev[i][0]]]]);
			this.copy_str(JSON.stringify(arr));
		}
	},
	paste_str: async function () {
		if (this.copy_mode == "inner") return cache;
		else return await navigator.clipboard.readText();
	},
	paste: async function () {
		arr = JSON.parse(await this.paste_str());
		if (arr.length == 0) return;
		let pos = (nrr.y2 - mousedata.y - rdelta) / hi;
		pos = [Math.floor(pos), Math.round(pos % 1 * heng), heng];
		let minTime = [Infinity, 0, 1];
		for (let i = 0; i < arr.length; i++)
			if (cmp2(arr[i].startTime, minTime)) minTime = arr[i].startTime;
		let offset = sub(pos, minTime);
		console.log(offset);
		if (arr[0].type == undefined) { // 复制的是事件
			for (let i = 0; i < arr.length; i++) {
				arr[i][1].startTime = add(arr[i][1].startTime, offset);
				arr[i][1].endTime = add(arr[i][1].endTime, offset);
				evs[evs_layer][arr[i][0]].push(arr[i][1]);
			}
		} else {
			for (let i = 0; i < arr.length; i++) {
				arr[i].startTime = add(arr[i].startTime, offset);
				arr[i].endTime = add(arr[i].endTime, offset);
				notes.push(arr[i]);
			}
			notecontrol.update();
		}
	}
}
// 操作：键盘、其他
// ============================================================================================
function put_qwer(key) { // 识别 q,w,e,r 键；这里专门搞一个函数出来，是为了适配手机端！
	if (key == "q") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 1);
	} else if (key == "e") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 3);
	} else if (key == "w") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 4);
	} else if (key == "r") {
		if (edit_event && mousedata.x > (nrr.x2 + evrr.x1) / 2) {
			let tmp = notecontrol.put_calc(evrr.x1, evrr.y1, evrr.x2, evrr.y2, mousedata.x, mousedata.y, evs_layer == "ex" ? 5 : 4);
			if (put_ev_st != null) {
				if (cmp(put_ev_st, tmp[1])) {
					if (evs_layer == "ex") { // 添加扩展事件
						console.log(put_ev_x, tmp[1]);
						eventcontrol.ex_add(put_ev_x, put_ev_st, tmp[1], eventcontrol.ex_getval_typex(tmp[0], put_ev_st), (put_ev_x == -135 ? [255, 255, 255] : (put_ev_x == 135 ? "" : 0)));
					} else {
						eventcontrol.add(put_ev_x, put_ev_st, tmp[1], eventcontrol.getval_typex(tmp[0], put_ev_st));
					}
				}
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
function delete_selection() {
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
		(evs_layer == "ex" ? now_line.extended : evs[evs_layer])[selection_ev[i][1]].splice(selection_ev[i][0], 1);
		for (let j = i + 1; j < selection_ev.length; j++) {
			if (selection_ev[i][1] == selection_ev[j][1]) selection_ev[j][0]--;
		}
	}
	selection_ev = [];
}
document.addEventListener('keydown', function (event) {
	if (event.key == "Control") control_down = 1;
	if (mousedata.in == 0) return;
	let key = event.key.toLowerCase();
	console.log("按键 " + key + " " + event.keyCode);
	if (key == "q" || key == "e" || key == "w" || key == "r") put_qwer(key);
	else if (key == "delete") delete_selection();
	else if (key == " ") playercontrol.change();
	else if (key == "c" && event.ctrlKey) clipboardcontrol.copy();
	else if (key == "v" && event.ctrlKey) clipboardcontrol.paste();
});
$("mobile-phone-delete").addEventListener("click", () => { // 等价于按下 delete
	delete_selection();
})
$("mobile-phone-play").addEventListener("click", () => { // 等价于按下空格
	playercontrol.change();
	if (playing == 1) $("mobile-phone-play").src = "img/icon2.svg";
	else $("mobile-phone-play").src = "img/icon1.svg";
})
document.addEventListener('keyup', function (event) {
	if (event.key == "Control") control_down = 0;
});
// 操作：鼠标、触摸
// ============================================================================================
$("eventlayer-ex").addEventListener("click", () => {
	evs_layer = "ex";
})
$("eventlayer-add").addEventListener("click", () => { // 添加事件层级
	evs.push({
		"alphaEvents": [],
		"moveXEvents": [],
		"moveYEvents": [],
		"rotateEvents": [],
		"speedEvents": []
	})
})
$("eventlayer-del").addEventListener("click", () => { // 删除事件层级
	if (evs.length > 1) {
		let e = evs[evs.length - 1];
		let cnt = e.alphaEvents.length + e.moveXEvents.length + e.moveYEvents.length + e.rotateEvents.length + e.speedEvents.length;
		if (cnt == 0 || "yes" == window.prompt("最后一个事件层级已经有事件了，是否强制删除？是输入 yes")) evs.pop();
	}
})
$("m-addline").addEventListener('click', () => {
	all_data.judgeLineList.push(new_judge_line());
	window.alert("添加成功");
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
$("m-player").addEventListener('click', () => {
	settingscontrol.settings.player ^= 1;
});
$("m-copy").addEventListener("click", () => {
	if (clipboardcontrol.copy_mode == "inner") {
		clipboardcontrol.copy_mode = "system";
		$("m-copy").innerText = "复制模式：系统剪贴板";
	} else {
		clipboardcontrol.copy_mode = "inner";
		$("m-copy").innerText = "复制模式：内置剪贴板";
	}
});
$("m-help1").addEventListener("click", () => {
	$("window-help").style.display = "flex";
	$("help-content").innerHTML = `
<h3>一、音符</h3>
1.基本操作<br>
单击 Q 放置 Tap；单击 W 放置 Drag；单击 E 放置 Flick；单击 R 选择 Hold 头部位置，再次单击 R，选择 Hold 尾部位置。<br>
单击选中最近音符。<br>
按住 ctrl 单击，可以多选。按住 shift 单击，可以快速框选多个音符。<br>
2.	曲线填充<br>
选中两个音符时，点击曲线填充音符，可以快速在两个音符之间填充。<br>
<h3>二、事件</h3>
注：如果右侧没有事件轨道，需要点击上方控制栏 -&gt; 编辑 -&gt; 打开/关闭事件<br>
放置方式和 Hold 的放置方式一样<br>
<h3>三、播放</h3>
空格键开始播放，再次按下空格键停止播放<br>
	`;
});
$("m-help2").addEventListener("click", () => {
	$("window-help").style.display = "flex";
	$("help-content").innerHTML = `
准备好 json 文件（制谱器文件菜单中点击保存为 rpe 格式），音乐文件，曲绘文件<br>
创建 info.txt 文件，内容示例：
<pre>
#
Name: 名字
Path: 114514
Song: 音乐.mp3
Picture: 曲绘.png
Chart: 谱面文件.json
Level: AT Lv.16
Composer: 曲师名字
Charter: 谱师名字
</pre>
接下来将 json 文件，音乐文件，曲绘文件，info.txt 这四个文件，打包为 <strong>zip</strong> 格式即可
	`;
});
$("line-selected").addEventListener("click", () => {
	$("lines").style.display = "block";
});
document.addEventListener("click", (event) => {
	if (!$("line-selector").contains(event.target)) {
		$("lines").style.display = 'none';
	}
});


sidebarcontrol.initedit();

$("cvs").addEventListener('wheel', (e) => {
	if (e.shiftKey) rdelta += e.deltaY * 8;
	else rdelta += e.deltaY;
	if (rdelta > 100) rdelta = 100;
});
var mousedata = {
	in: 0, x: 0, y: 0, down: 0, moved: 0, drag: null,
	sel_rect: { x1: null, y1: null, x2: null, y2: null }
}; // canvas 坐标系（drag：拖动中的音符，null表示没有拖动，moved：鼠标按下后是否移动过，sel_rect：选中区域，x1=null表示没有）
$("cvs").addEventListener("mousemove", function (event) {
	const rect = $("cvs").getBoundingClientRect(); // 计算鼠标相对于 canvas 内部的坐标，考虑缩放
	mousedata.x = (event.clientX - rect.left) * $("cvs").width / rect.width;
	mousedata.y = (event.clientY - rect.top) * $("cvs").height / rect.height;
	mousedata.in = 1;
	if (mousedata.drag != null) { // 拖动普通音符
		let s = notecontrol.put_calc(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y);
		if (s[0] != notes[mousedata.drag].positionX || !cmparray(s[1], notes[mousedata.drag].startTime)) {
			if (mousedata.dragtype == "single") {
				let note = note_extract(notes[mousedata.drag]);
				note.positionX = s[0];
				let offsety = sub(s[1], note.startTime);
				note.startTime = add(note.startTime, offsety);
				note.endTime = add(note.endTime, offsety);
				notes[mousedata.drag] = note_compress(note);
			} else {
				let note = note_extract(notes[mousedata.drag]);
				let offsetx = s[0] - note.positionX;
				let offsety = sub(s[1], note.startTime);
				for (let i of selection) {
					let note = note_extract(notes[i]);
					note.positionX += offsetx;
					note.startTime = add(note.startTime, offsety);
					note.endTime = add(note.endTime, offsety);
					notes[i] = note_compress(note);
				}
			}
			notecontrol.update();
		}
	}
	mousedata.moved = 1;
});
$("cvs").addEventListener("mouseout", function () {
	mousedata.in = 0;
});
$("cvs").addEventListener("mousedown", (event) => {
	if (event.button == 0) {
		event.preventDefault();
		mousedata.down = 1;
		mousedata.drag = null;
		mousedata.moved = 0;
		if (!edit_event || mousedata.x < (nrr.x2 + evrr.x1) / 2) { // 点击到音符区域
			if (event.shiftKey) {
				if (mousedata.sel_rect.x1 != null) { // 拖动选中区域

					mousedata.sel_rect.x2 = mousedata.x;
					mousedata.sel_rect.y2 = ((nrr.y2 - mousedata.y) - rdelta) / hi;

					let x1 = Math.min(mousedata.sel_rect.x1, mousedata.sel_rect.x2);
					let x2 = Math.max(mousedata.sel_rect.x1, mousedata.sel_rect.x2);
					let y1 = Math.min(mousedata.sel_rect.y1, mousedata.sel_rect.y2);
					let y2 = Math.max(mousedata.sel_rect.y1, mousedata.sel_rect.y2);
					function to(s) {
						return s[0] + s[1] / s[2];
					}
					for (let i = 0; i < notes.length; i++) {
						if (selection.includes(i)) continue;
						let note = note_extract(notes[i]);
						let tx = nrr.x1 + (nrr.x2 - nrr.x1) * ((note.positionX + 675) / 1350); // 转换到 canvas 坐标系
						if (note.type == 2) {
							if (x1 <= tx && tx <= x2 && (y1 <= to(note.startTime) && to(note.startTime) <= y2 || y1 <= to(note.endTime) && to(note.endTime) <= y2)) {
								selection.push(i);
								selection_ev.length = 0;
							}
						} else {
							if (x1 <= tx && tx <= x2 && y1 <= to(note.startTime) && to(note.startTime) <= y2) {
								selection.push(i);
								selection_ev.length = 0;
							}
						}
					}

					mousedata.sel_rect.x1 = null;
					mousedata.sel_rect.y1 = null;
					sidebarcontrol.edit_update();
				} else {
					mousedata.sel_rect.x1 = mousedata.x;
					mousedata.sel_rect.y1 = ((nrr.y2 - mousedata.y) - rdelta) / hi;
				}
				mousedata.moved = 1; // 防止触发音符选择
			} else {
				let p = notecontrol.check_select(nrr.x1, nrr.y1, nrr.x2, nrr.y2, 80); // 距离 < 80 才触发拖动，不容易误触
				if (p != null && notes[p].type != 2) {
					mousedata.drag = p;
					if (selection.length == 0)
						mousedata.dragtype = "single";
					else mousedata.dragtype = "all";
					console.log(mousedata.drag);
				}
			}
		}
	}
});
document.addEventListener("mouseup", (event) => {
	if (event.button == 0) {
		event.preventDefault();
		mousedata.down = 0;
		if (mousedata.drag != null) {
			mousedata.drag = null;
		}
		if (!mousedata.moved) { // 单击
			if (mode != "computer") {
				if (edit_event && mousedata.x > (nrr.x2 + evrr.x1) / 2) put_qwer("r"); // 点击到事件区域，均视为放置事件
				else put_qwer(mode);
			} else {
				if (edit_event && mousedata.x > (nrr.x2 + evrr.x1) / 2) { // 点击到事件区域
					let p = eventcontrol.check_select(evrr.x1, evrr.y1, evrr.x2, evrr.y2);
					if (p == undefined) return;
					selection = [];
					if (control_down == 0) {
						if (selection_ev.length == 1 && cmparray(selection_ev[0], p)) selection_ev = [];
						else selection_ev = [p];
					} else {
						if (selection_ev.includes(p)) {
							selection_ev.splice(selection.indexOf(p), 1);
						}
						else selection_ev.push(p);
					}
					sidebarcontrol.edit_update();
				} else { // 点击到音符区域
					let p = notecontrol.check_select(nrr.x1, nrr.y1, nrr.x2, nrr.y2);
					if (p == undefined) return;
					selection_ev = [];
					if (control_down == 0) {
						if (selection[0] == p && selection.length == 1) selection = [];
						else selection = [p];
					} else {
						if (selection.includes(p)) {
							selection.splice(selection.indexOf(p), 1);
						}
						else selection.push(p);
					}
					sidebarcontrol.edit_update();
				}
			}
		}
	}
});

// 移动设备的滑动
let delta = 0;
document.addEventListener('touchstart', function (e) {
	delta = e.touches[0].clientY;
}, { passive: false });
document.addEventListener('touchmove', function (e) {
	if (e.touches.length == 1) {
		e.preventDefault();
		let currentDelta = e.touches[0].clientY;
		let distance = currentDelta - delta;
		delta = currentDelta;
		rdelta -= distance;
		if (rdelta > 100) rdelta = 100;
	}
}, { passive: false });
for (let i = 0; i <= 4; i++) {
	$("mode").children[i].addEventListener('click', () => {
		mode = ["computer", "q", "w", "e", "r"][i];
		if (i == 0) put_hold_st = null; // 停止放置长条
	});
}
$("fillnotes-open").addEventListener('click', () => {
	$("window-fillnotes").style.display = 'flex';
	let note0 = note_extract(notes[selection[0]]);
	let note1 = note_extract(notes[selection[1]]);
	if (selection.length == 1) {
		$("fillnotes-time").value = note0.startTime[0] + ":" + note0.startTime[1] + "/" + note0.startTime[2];
		$("fillnotes-x").value = note0.positionX;
		$("fillnotes-flag").checked = 0;
	}
	if (selection.length == 2) {
		if (cmp2(note0.startTime, note1.startTime)) {
			$("fillnotes-time").value = note0.startTime[0] + ":" + note0.startTime[1] + "/" + note0.startTime[2];
			$("fillnotes-x").value = note0.positionX;
			$("fillnotes-time2").value = note1.startTime[0] + ":" + note1.startTime[1] + "/" + note1.startTime[2];
			$("fillnotes-x2").value = note1.positionX;
		} else {
			$("fillnotes-time").value = note1.startTime[0] + ":" + note1.startTime[1] + "/" + note1.startTime[2];
			$("fillnotes-x").value = note1.positionX;
			$("fillnotes-time2").value = note0.startTime[0] + ":" + note0.startTime[1] + "/" + note0.startTime[2];
			$("fillnotes-x2").value = note0.positionX;
		}
	}
});
$("fillnotes").addEventListener('click', () => {
	// st 填充到 ed，每次增加 density
	let st = $("fillnotes-time").value.split(/[:\/]/);
	if (!is_beat(st)) return;
	st = [Number(st[0]), Number(st[1]), Number(st[2])];
	let ed = $("fillnotes-time2").value.split(/[:\/]/);
	if (!is_beat(ed)) return;
	ed = [Number(ed[0]), Number(ed[1]), Number(ed[2])];
	let density = $("fillnotes-density").value.split(/[:\/]/);;
	if (!is_beat(density)) return;
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

setInterval(main, 1000 / 60);