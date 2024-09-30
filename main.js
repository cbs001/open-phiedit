// 全局变量 / 数据管理
// ============================================================================================
window.$ = (e) => {
	return document.getElementById(e);
}
var ctx = document.getElementById("cvs").getContext("2d");
var imgs = [new Image(), new Image(), new Image(), new Image()];
const dpr = window.devicePixelRatio;
imgs[0].src = "Tap.png";
imgs[1].src = "Hold.png";
imgs[2].src = "Flick.png";
imgs[3].src = "Drag.png";
var n = 114514, heng = 4, shu = 7, hi = 200; // 小节数，横着分几格，竖着分几格，每小节高度
var selection = []; // 当前选中的音符
var selection_ev = []; // 当前选中的事件
var put_hold_st = null, put_hold_x; // 放置 Hold 音符用
var put_ev_st = null, put_ev_x; // 放置事件用
var control_down = 0; // ctrl 键是否按下
var bpm = 80;
var edit_event = 0; // 是否编辑事件
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
	if (!Array.isArray(a) || !Array.isArray(b) || a.length != b.length) return false;
	for (let i = 0; i < a.length; i++)
		if (a[i] != b[i])
			return false;
	return true;
}
// 音符管理
// ============================================================================================
var notecontrol = {
	/*
	本模块不使用 nrr 变量，需要手动传入渲染的矩形范围，这样更灵活
	*/
	add: (type, time, x) => {
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
	},
	addhold: (st, ed, x) => {
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
	},
	/*
	音符区域相对坐标：1350*900（rpe 坐标系），(0,0) 为正中心，向上向右为正，仅在渲染时转换为绝对坐标
	put_note，select_note 等函数同理
	*/
	render_line: (x1, y1, x2, y2, _shu = shu) => {
		for (let i = Math.floor(Math.max(-rdelta / hi, 0)); i < n; i++) {
			for (let j = 0; j < heng; j++) {
				ctx.lineWidth = (j == 0 ? 5 : 1);
				let y = (i * hi + (j / heng) * hi) - 450;
				y += rdelta;
				if (y > 450) break;
				let ty = y2 - ((y + 450) / 900) * (y2 - y1); // 绝对坐标
				ctx.strokeStyle = "#ffffff";
				ctx.beginPath();
				ctx.moveTo(x1, ty);
				ctx.lineTo(x2, ty);
				ctx.closePath();
				ctx.stroke();
			}
		}
		ctx.lineWidth = 2;
		for (let j = 0; j <= _shu; j++) {
			let tx = x1 + (j / _shu) * (x2 - x1); // 绝对坐标
			ctx.strokeStyle = "#ffffff";
			ctx.beginPath();
			ctx.moveTo(tx, y1);
			ctx.lineTo(tx, y2);
			ctx.closePath();
			ctx.stroke();
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
		for (let i = 0; i < notes.length; i++) {
			if (notes[i].type == 2) {
				let st = -450 + hi * (notes[i].startTime[0] + notes[i].startTime[1] / notes[i].startTime[2]);
				st += rdelta;
				let ed = -450 + hi * (notes[i].endTime[0] + notes[i].endTime[1] / notes[i].endTime[2]);
				ed += rdelta;
				drawhold(x1 + (x2 - x1) * ((notes[i].positionX + 675) / 1350), y2 - ((st + 450) / 900) * (y2 - y1), y2 - ((ed + 450) / 900) * (y2 - y1), (selection.includes(i) ? 0.13 : 0.1));
			}
		}
		if (put_hold_st != null) {
			let ed = -450 + hi * (put_hold_st[0] + put_hold_st[1] / put_hold_st[2]);
			ed += rdelta;
			drawhold(x1 + (x2 - x1) * ((put_hold_x + 675) / 1350), mousedata.y, y2 - ((ed + 450) / 900) * (y2 - y1), 0.1);
		}
		for (let i = 0; i < notes.length; i++) {
			if (notes[i].type != 2) {
				let y = -450 + hi * (notes[i].startTime[0] + notes[i].startTime[1] / notes[i].startTime[2]);
				y += rdelta;
				let h = (Math.round(notes[i].positionX) * 100000 + Math.round(y).toFixed(0));
				let t = mp.get(h);
				if (t == undefined) t = 0;
				if (t < 20) { // 堆叠过多时不显示
					draw(notes[i].type, x1 + (x2 - x1) * ((notes[i].positionX + 675) / 1350), y2 - ((y + 450) / 900) * (y2 - y1), (selection.includes(i) ? 0.13 : 0.1), t * 25 * Math.PI / 180);
					mp.set(h, t + 1);
				}
			}
		}
	},
	put_calc: (x1, y1, x2, y2, tx, ty, _shu = shu) => { // 根据鼠标坐标，推出被点击音符的位置
		if (tx < x1 || tx > x2 || ty < y1 || ty > y2) return;

		let x = (tx - x1) / (x2 - x1) * 1350 - 675;
		let y = (y2 - ty) / (y2 - y1) * 900 - 450;
		// console.log(x, y);
		y -= rdelta;

		if (y < -450) return;

		let a = Math.floor((y + 450) / hi);
		let b = Math.round((y + 450) % hi / (hi / heng));

		console.log(a, b);
		return [Math.round((x - 675) / (1350 / _shu)) * (1350 / _shu) + 675, [a, b, heng]];
	},
	put: (x1, y1, x2, y2, tx, ty, type) => {
		if (tx < x1 || tx > x2 || ty < y1 || ty > y2) return;

		let a = notecontrol.put_calc(x1, y1, x2, y2, tx, ty);
		notecontrol.add(type, a[1], a[0]);
	},
	hold_calc: (x, yst, yed, x1, y1, x2, y2) => { // 坐标 x，时间范围 (yst-yed)，渲染区间 (x1,y1) 到 (x2,y2)，求出到鼠标的距离的平方
		yst += rdelta;
		yed += rdelta;
		let tx = x1 + (x2 - x1) * ((x + 675) / 1350);
		// 长条下面的 y（开始触发），上面的 y（结束触发），tyst > tyed
		let tyst = y2 - ((yst + 450) / 900) * (y2 - y1), tyed = y2 - ((yed + 450) / 900) * (y2 - y1);
		console.log(x1, x2, tx, tyst, tyed, mousedata.x, mousedata.y);
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
				console.log(i, d);
				if (d < minn) minn = d, ans = i; // 选中音符
			}
		}
		console.log(minn);
		return ans;
	},
	edit: () => { // 显示编辑面板
		if (selection.length == 1) {
			$("edit").style.display = "block";
			$("edit-x").value = notes[selection[0]].positionX;
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
				if (isNaN(Number($("edit-x").value))) $("edit-x").value = notes[selection][0].positionX;
				else {
					for (let i = 0; i < selection.length; i++) {
						notes[selection[i]].positionX = Number($("edit-x").value);
					}
				}
			}
		});
		$("edit-time").addEventListener("change", () => {
			if (selection.length == 1) {
				let s = $("edit-time").value.split(/[:\/]/);
				if (isBeat(s)) {
					notes[selection].startTime = [Number(s[0]), Number(s[1]), Number(s[2])];
				}
				if (notes[selection].type != 2) $("edit-time2").value = $("edit-time").value, notes[selection].endTime = notes[selection].startTime;
			}
		});
		$("edit-time2").addEventListener("change", () => {
			if (selection.length == 1) {
				let s = $("edit-time").value.split(/[:\/]/);
				if (isBeat(s)) {
					notes[selection].endTime = [Number(s[0]), Number(s[1]), Number(s[2])];
				}
				if (notes[selection].type != 2) $("edit-time").value = $("edit-time2").value, notes[selection].startTimeTime = notes[selection].endTime;
			}
		});
		$("edit-d").addEventListener("change", () => {
			if (selection.length > 0) {
				for (let i = 0; i < selection.length; i++) notes[selection[i]].above = Number($("edit-d").value);
			}
		});
		$("edit-t").addEventListener("change", () => {
			if (selection.length > 0) {
				for (let i = 0; i < selection.length; i++) notes[selection[i]].isFake = Number($("edit-d").value);
			}
		});
	}
};
// 事件管理
// ============================================================================================
var eventcontrol = {
	add: (typex, st, ed) => { // 添加事件
		let t = ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"][Math.round((typex + 675) / 337.5)];
		evs[evs_layer][t].push({
			"bezier": 0,
			"bezierPoints": [0.0, 0.0, 0.0, 0.0],
			"easingLeft": 0.0,
			"easingRight": 1.0,
			"easingType": 1,
			"end": 0.0,
			"endTime": ed,
			"linkgroup": 0,
			"start": 0.0,
			"startTime": st
		});
	},
	render: function (x1, y1, x2, y2) {
		notecontrol.render_line(x1, y1, x2, y2, 4); // 借用 notes 的程序渲染
		function draw(x, y, y2, sz /* canvas 坐标系 */) {
			let w = 1089 * sz;
			let gra = ctx.createLinearGradient(x, y, x, y2); // 渐变
			gra.addColorStop(0, "#01ff4b96");
			gra.addColorStop(1, "#01fbff96");
			ctx.fillStyle = gra;
			ctx.fillRect(x - w / 2, y, w, y2 - y);
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
				draw(x1 + (x2 - x1) * ((x + 675) / 1350), y2 - ((ed + 450) / 900) * (y2 - y1), y2 - ((st + 450) / 900) * (y2 - y1), (f ? 0.13 : 0.1));
			}
			x += 337.5;
		}

		if (put_ev_st != null) {
			let ed = -450 + hi * (put_ev_st[0] + put_ev_st[1] / put_ev_st[2]);
			ed += rdelta;
			draw(x1 + (x2 - x1) * ((put_ev_x + 675) / 1350), mousedata.y, y2 - ((ed + 450) / 900) * (y2 - y1), 0.1);
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
				console.log(x, type, d);
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
	}
};
// 下方设置面板管理 / 界面设置
// ============================================================================================
var settingscontorl = {
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
	}
};
settingscontorl.load();
settingscontorl.init();
// 渲染
// ============================================================================================
var rdelta = 0;
var r_last_lines_length;
function main() {
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
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, 1600, 900);
	notecontrol.render(nrr.x1, nrr.y1, nrr.x2, nrr.y2);
	if (edit_event) eventcontrol.render(evrr.x1, evrr.y1, evrr.x2, evrr.y2);
}
// 操作
// ============================================================================================
notecontrol.initedit();
eventcontrol.initedit();
document.addEventListener('wheel', (e) => {
	rdelta += e.deltaY;
});
var mousedata = { in: 0, x: 0, y: 0 }; // canvas 坐标系
$("cvs").addEventListener("mouseover", function (event) {
	mousedata.in = 1;
});
$("cvs").addEventListener("mousemove", function (event) {
	const rect = $("cvs").getBoundingClientRect();
	// 计算鼠标相对于 canvas 内部的坐标，考虑缩放
	mousedata.x = (event.clientX - rect.left) * $("cvs").width / rect.width;
	mousedata.y = (event.clientY - rect.top) * $("cvs").height / rect.height;
});
$("cvs").addEventListener("mouseout", function (event) {
	mousedata.in = 0;
});
document.addEventListener('keydown', function (event) {
	if (event.key == "Control") control_down = 1;
	if (mousedata.in == 0) return;
	event.key = event.key.toLowerCase();
	console.log(event.key);
	if (event.key == "q") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 1);
	} else if (event.key == "e") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 3);
	} else if (event.key == "w") {
		notecontrol.put(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y, 4);
	} else if (event.key == "r") {
		if (edit_event && mousedata.x > (nrr.x2 + evrr.x1) / 2) {
			let tmp = notecontrol.put_calc(evrr.x1, evrr.y1, evrr.x2, evrr.y2, mousedata.x, mousedata.y, 4);
			if (put_ev_st != null) {
				if (tmp[1][0] + tmp[1][1] / tmp[1][2] > put_ev_st[0] + put_ev_st[1] / put_ev_st[2]) eventcontrol.add(put_ev_x, put_ev_st, tmp[1])
				put_ev_st = null;
			} else if (tmp != null) {
				put_ev_x = tmp[0], put_ev_st = tmp[1];
			}
		} else {
			let tmp = notecontrol.put_calc(nrr.x1, nrr.y1, nrr.x2, nrr.y2, mousedata.x, mousedata.y);
			if (put_hold_st != null) {
				if (tmp[1][0] + tmp[1][1] / tmp[1][2] > put_hold_st[0] + put_hold_st[1] / put_hold_st[2]) notecontrol.addhold(put_hold_st, tmp[1], put_hold_x)
				put_hold_st = null;
			} else if (tmp != null) {
				put_hold_x = tmp[0], put_hold_st = tmp[1];
			}
		}

	} else if (event.key == "Delete") {
		selection.sort((a, b) => a - b)
		for (let i = 0; i < selection.length; i++) {
			notes.splice(selection[i] - i, 1);
		}
		selection = [];
	}
});
document.addEventListener('keyup', function (event) {
	if (event.key == "Control") control_down = 0;
});
$("cvs").addEventListener('click', function () {
	if (edit_event && mousedata.x > (nrr.x2 + evrr.x1) / 2) { // 点击到事件区域
		let p = eventcontrol.check_select(evrr.x1, evrr.y1, evrr.x2, evrr.y2);
		if (p == undefined) return;
		selection = [];
		if (control_down == 0) {
			if (cmparray(selection_ev[0], p) && selection_ev.length == 1) selection_ev = [], notecontrol.hedit();
			else selection_ev = [p], eventcontrol.edit(), notecontrol.hedit();
		} else {
			if (selection_ev.includes(p)) {
				selection_ev.splice(selection.indexOf(p), 1);
				if (selection_ev.length == 0) eventcontrol.hedit();
			}
			else selection_ev.push(p);
		}
	} else { // 点击到音符区域
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
	}
});
$("lines").addEventListener('change', () => {
	notes = all_data.judgeLineList[$("lines").value].notes;
	selection = [];
});
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
setInterval(main, 1000 / 60); // 60 帧