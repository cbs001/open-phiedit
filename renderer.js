let renderer = {
	x1: 125,
	y1: 0,
	x2: 1475,
	y2: 900,
	pre: function () { // 预处理
		// 初始化缓存
		if (this.cache == null || this.cache.length != all_data.judgeLineList.length) {
			this.cache = [];
			for (let i = 0; i < all_data.judgeLineList.length; i++) this.cache.push(new Array);
		}

		function to(a) {
			return a[0] + a[1] / a[2];
		}
		for (let i = 0; i < all_data.judgeLineList.length; i++) {
			let line = all_data.judgeLineList[i];
			for (let j = 0; j < line.eventLayers.length; j++) {
				// const e = ["moveXEvents", "moveYEvents", "rotateEvents", "", ""];
				if (line.eventLayers[j] != null) {
					line.eventLayers[j].moveXEvents.sort((a, b) => to(a.startTime) - to(b.startTime));
					line.eventLayers[j].moveYEvents.sort((a, b) => to(a.startTime) - to(b.startTime));
					line.eventLayers[j].rotateEvents.sort((a, b) => to(a.startTime) - to(b.startTime));
					line.eventLayers[j].alphaEvents.sort((a, b) => to(a.startTime) - to(b.startTime));
					line.eventLayers[j].speedEvents.sort((a, b) => to(a.startTime) - to(b.startTime));
				}
			}
			if (line.notes != null) {
				this.cache[i] = [];
				for (let j = 0; j < line.notes.length; j++) {
					if (line.notes[j].type == 2) this.cache[i].push({ st: this.getdis(line, line.notes[j].startTime), ed: this.getdis(line, line.notes[j].endTime) });
					else this.cache[i].push(this.getdis(line, line.notes[j].startTime));
				}
			}
		}
	},
	basic_getval: function (e, t) { // 单层级事件：e 为事件 Array，t 为一个带分数表示时间
		let val = 0;
		for (let i = 0; i < e.length; i++) {
			if (cmp(e[i].endTime, t)) { // endTime <= t 已结束
				val = e[i].end;
			} else if (cmp(e[i].startTime, t)) { // startTime <= t 进行中
				val = e[i].start + (e[i].end - e[i].start) * calcease(e[i].easingType, e[i].easingLeft + (e[i].easingRight - e[i].easingLeft) * div(sub(t, e[i].startTime), sub(e[i].endTime, e[i].startTime)))
			}
		}
		return val;
	},
	basic_getval_colorevents: function (e, t) { // 同 basic_getval，用来处理颜色事件
		let val = [255, 255, 255];
		for (let i = 0; i < e.length; i++) {
			if (cmp(e[i].endTime, t)) { // endTime <= t 已结束
				val = e[i].end;
			} else if (cmp(e[i].startTime, t)) { // startTime <= t 进行中
				let ratio = calcease(e[i].easingType, e[i].easingLeft + (e[i].easingRight - e[i].easingLeft) * div(sub(t, e[i].startTime), sub(e[i].endTime, e[i].startTime)));
				for (let j = 0; j < 3; j++) val[j] = e[i].start[j] + (e[i].end[j] - e[i].start[j]) * ratio;
			}
		}
		return val;
	},
	basic_getval_textevents: function (e, t) { // 同 basic_getval，用来处理文字事件
		function tonum(s) {
			let s2 = "";
			for (let i = 0; i < s.length; i++) {
				if (s.substring(i, i + 3) == "%P%") i += 2;
				else s2 += s[i];
			}
			return Number(s2);
		}
		let str = "";
		for (let i = 0; i < e.length; i++) {
			if (cmp(e[i].endTime, t)) { // endTime <= t 已结束
				str = e[i].end;
			} else if (cmp(e[i].startTime, t)) { // startTime <= t 进行中
				let ratio = calcease(e[i].easingType, e[i].easingLeft + (e[i].easingRight - e[i].easingLeft) * div(sub(t, e[i].startTime), sub(e[i].endTime, e[i].startTime)));
				if (e[i].start.includes("%P%") && e[i].end.includes("%P%")) {
					let start_num = tonum(e[i].start);
					let end_num = tonum(e[i].end);
					if (isNaN(start_num) && isNaN(end_num)) str = "";
					else if (start_num % 1 === 0 && end_num % 1 === 0) str = (start_num + (end_num - start_num) * ratio).toFixed(0);
					else str = (start_num + (end_num - start_num) * ratio).toFixed(3);
				} else if (e[i].end.startsWith(e[i].start)) {// 逐渐添加字符
					str = e[i].end.substring(0, Math.round(e[i].start.length + ratio * (e[i].end.length - e[i].start.length)));
				} else if (e[i].start.startsWith(e[i].end)) { // 逐渐删除字符
					str = e[i].start.substring(0, Math.round(e[i].start.length - ratio * (e[i].start.length - e[i].end.length)));
				} else {
					str = e[i].start;
				}
			}
		}
		return str;
	},
	getval: function (line, e, t) { // 多层级普通事件：line 为判定线信息，e 为事件名，t 为一个带分数表示时间
		let s = 0;
		for (let i = 0; i < line.eventLayers.length; i++)
			if (line.eventLayers[i] != null) s += this.basic_getval(line.eventLayers[i][e], t);
		return s;
	},
	basic_getdis: function (e, t) { // 单层级求距离：e 为速度事件 Array，t 为一个带分数表示时间
		function to(a) {
			return a[0] + a[1] / a[2];
		}
		let val = 0;
		for (let i = 0; i < e.length; i++) {
			if (cmp(e[i].endTime, e[i].startTime)) {
				let tmp = e[i].startTime;
				e[i].startTime = e[i].endTime;
				e[i].endTime = tmp;
			}

			if (cmp(e[i].endTime, t)) { // endTime <= t 已结束
				val += (e[i].start + e[i].end) / 2 * beat_to_sec(sub(e[i].endTime, e[i].startTime));
			} else {
				if (cmp(e[i].startTime, t)) { // startTime <= t 进行中
					let now = e[i].start + (e[i].end - e[i].start) * div(sub(t, e[i].startTime), sub(e[i].endTime, e[i].startTime))
					val += (e[i].start + now) / 2 * beat_to_sec(sub(t, e[i].startTime));
				}
				break; // 后面的肯定都没开始，直接跳出
			}
			let t2 = t;
			if (i != e.length - 1 && cmp2(e[i + 1].startTime, t2)) t2 = e[i + 1].startTime;
			val += beat_to_sec(sub(t2, e[i].endTime)) * e[i].end;

		}
		return 120 * val;
	},
	getdis: function (line, t) { // 多层级求距离：line 为判定线信息，t 为一个带分数表示时间
		let s = 0;
		for (let i = 0; i < line.eventLayers.length; i++)
			if (line.eventLayers[i] != null) s += this.basic_getdis(line.eventLayers[i].speedEvents, t);
		return s;
	},
	order: [],
	calcfa: function () {
		let n = all_data.judgeLineList.length;
		this.order = [];
		let c = new Array(n); // 孩子
		let vis = new Array(n);
		for (let i = 0; i < n; i++) c[i] = [];
		for (let i = 0; i < n; i++)
			if ((all_data.judgeLineList[i].father ?? -1) != -1)
				c[all_data.judgeLineList[i].father].push(i);
		function dfs(x, order) {
			if (vis[x] == 1) return;
			vis[x] = 1, order.push(x);
			for (let i = 0; i < c[x].length; i++) dfs(c[x][i], order);
		}
		for (let i = 0; i < n; i++)
			if ((all_data.judgeLineList[i].father ?? -1) == -1)
				dfs(i, this.order);
	},
	cache: null,
	attributes_control: function (con, name, x) {
		if(!Array.isArray(con)) return 1;
		// console.log(name, con);
		let l = 0, r = con.length - 1;
		while (l <= r) {
			let mid = (l + r) >> 1;
			if (con[mid].x <= x) l = mid + 1;
			else r = mid - 1;
		}
		if(r==-1) return con[0][name];
		else if(r==con.length - 1) return con[r][name];
		return con[r][name] + (con[r + 1][name] - con[r][name]) * calcease(con[r].easing, (x - con[r].x) / (con[r + 1].x - con[r].x));
	},
	main: function (t, show_combo_UI) { // t 为一个带分数表示时间
		let draw = (t, x, y, sz, ang /* canvas 坐标系 */, alpha) => {
			let w = 1089 * sz, h = [100, null, 200, 60][t - 1] * sz;
			if (x + w >= -100 && x <= 1700 && y + h >= -100 && y <= 1000) { // 屏幕内的才绘制
				let old = ctx.globalAlpha;
				ctx.globalAlpha *= (alpha/255);
				ctx.translate(x, y), ctx.rotate(ang);
				ctx.drawImage(imgs[t - 1], Math.round(- w / 2), Math.round(-h / 2), w, h);
				ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵
				ctx.globalAlpha = old;
			}
		}
		let drawhold = (x, y, sz, ang /* canvas 坐标系 */, h) => {
			let w = 1089 * sz;
			ctx.translate(x, y), ctx.rotate(ang);
			ctx.drawImage(imgs[1], Math.round(- w / 2), Math.round(-h), w, h);
			ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵
		}

		this.calcfa();

		let n = all_data.judgeLineList.length;
		let x = new Array(n);
		let y = new Array(n);
		let f = new Array(n);
		let combo = 0;
		for (let order_i = 0; order_i < all_data.judgeLineList.length; order_i++) {
			let i = this.order[order_i];
			let line = all_data.judgeLineList[i];
			// 计算基本属性
			x[i] = this.getval(line, "moveXEvents", t);
			y[i] = this.getval(line, "moveYEvents", t);
			if ((line.father ?? -1) != -1) {
				let x2 = x[line.father] + Math.sin(f[line.father] * (Math.PI / 180)) * y[i] + Math.cos(f[line.father] * (Math.PI / 180)) * x[i];
				let y2 = y[line.father] + Math.cos(f[line.father] * (Math.PI / 180)) * y[i] - Math.sin(f[line.father] * (Math.PI / 180)) * x[i];
				x[i] = x2, y[i] = y2;
			}
			f[i] = this.getval(line, "rotateEvents", t);
			let a = this.getval(line, "alphaEvents", t);
			if (a < 0) continue;
			// console.log(i, x[i], y[i], a);
			// ctx.strokeStyle = "#FFFFFF" + "0123456789ABCDEF"[Math.floor(a / 16)] + "0123456789ABCDEF"[Math.floor(a % 16)];
			let line_color = (line.extended["colorEvents"] == undefined ? [255, 255, 255] : this.basic_getval_colorevents(line.extended["colorEvents"], t));
			if (line.extended["textEvents"] == undefined) {
				// 绘制判定线
				ctx.lineWidth = 5 * (line.extended["scaleYEvents"] == undefined ? 1 : this.basic_getval(line.extended["scaleYEvents"], t));
				let line_length = 2000 * (line.extended["scaleXEvents"] == undefined ? 1 : this.basic_getval(line.extended["scaleXEvents"], t));
				ctx.strokeStyle = "rgba(" + line_color[0] + "," + line_color[1] + "," + line_color[2] + "," + a / 255 + ")";
				ctx.beginPath();
				ctx.moveTo(this.x1 + (x[i] - line_length * Math.cos(f[i] * Math.PI / 180) + 675) / 1350 * (this.x2 - this.x1), this.y2 - (y[i] + line_length * Math.sin(f[i] * Math.PI / 180) + 450) / 900 * (this.y2 - this.y1));
				ctx.lineTo(this.x1 + (x[i] + line_length * Math.cos(f[i] * Math.PI / 180) + 675) / 1350 * (this.x2 - this.x1), this.y2 - (y[i] - line_length * Math.sin(f[i] * Math.PI / 180) + 450) / 900 * (this.y2 - this.y1));
				ctx.closePath();
				ctx.stroke();
			} else {
				ctx.fillStyle = "rgba(" + line_color[0] + "," + line_color[1] + "," + line_color[2] + "," + a / 255 + ")"; // 文字颜色
				ctx.textAlign = "center";
				let line_text = this.basic_getval_textevents(line.extended["textEvents"], t);
				ctx.fillText(line_text, this.x1 + (this.x2 - this.x1) * (x[i] + 675) / 1350, this.y2 - (this.y2 - this.y1) * (y[i] + 450) / 900);
			}

			let passed = this.getdis(line, t); // 音符已经经过的距离

			for (let j = 0; j < (line.notes == undefined ? 0 : line.notes.length); j++) {
				if (cmp2(line.notes[j].endTime, t)) {
					if (line.notes[j].isFake == 0) combo++;
					continue;
				}
				if (line.notes[j].above != 1) f[i] += 180, line.notes[j].positionX *= -1; // 绘制反面的音符
				if (line.notes[j].type == 2) {
					// x1：开始位置，x2：结束位置，y 同理
					let notex1, notey1, dis1;
					if (cmp2(line.notes[j].startTime, t)) { // 开始接触判定线了
						dis1 = 0;
					} else {
						dis1 = this.cache[i][j].st - passed;
					}
					let dis2 = this.cache[i][j].ed - passed;
					if (dis1 < 1700) {
						notex1 = x[i] + Math.sin(f[i] * (Math.PI / 180)) * dis1 + Math.cos(f[i] * (Math.PI / 180)) * line.notes[j].positionX;
						notey1 = y[i] + Math.cos(f[i] * (Math.PI / 180)) * dis1 - Math.sin(f[i] * (Math.PI / 180)) * line.notes[j].positionX;
						let notex2 = x[i] + Math.sin(f[i] * (Math.PI / 180)) * dis2 + Math.cos(f[i] * (Math.PI / 180)) * line.notes[j].positionX;
						let notey2 = y[i] + Math.cos(f[i] * (Math.PI / 180)) * dis2 - Math.sin(f[i] * (Math.PI / 180)) * line.notes[j].positionX;
						let tx1 = this.x1 + (this.x2 - this.x1) * ((notex1 + 675) / 1350);
						let ty1 = this.y2 - (this.y2 - this.y1) * ((notey1 + 450) / 900);
						let tx2 = this.x1 + (this.x2 - this.x1) * ((notex2 + 675) / 1350);
						let ty2 = this.y2 - (this.y2 - this.y1) * ((notey2 + 450) / 900);
						drawhold(tx1, ty1, 0.15, f[i] * (Math.PI / 180), Math.sqrt((tx2 - tx1) * (tx2 - tx1) + (ty2 - ty1) * (ty2 - ty1)));
					}
				} else {
					let dis = this.cache[i][j] - passed; // 音符现在到判定线的距离
					let attr_dis = this.attributes_control(now_line.yControl, "y", dis);
					if (dis < 1700) {
						let attr_x = this.attributes_control(now_line.posControl, "pos", dis); // 相对于判定线的 x 坐标
						let notex = x[i] + Math.sin(f[i] * (Math.PI / 180)) * (dis * attr_dis + line.notes[j].yOffset) + Math.cos(f[i] * (Math.PI / 180)) * line.notes[j].positionX * attr_x;
						let notey = y[i] + Math.cos(f[i] * (Math.PI / 180)) * (dis * attr_dis + line.notes[j].yOffset) - Math.sin(f[i] * (Math.PI / 180)) * line.notes[j].positionX * attr_x;

						let attr_size = this.attributes_control(now_line.sizeControl, "size", dis);
						let attr_alpha = this.attributes_control(now_line.alphaControl, "alpha", dis);
						draw(line.notes[j].type, this.x1 + (this.x2 - this.x1) * ((notex + 675) / 1350), this.y2 - (this.y2 - this.y1) * ((notey + 450) / 900), 0.15 * line.notes[j].size * attr_size, f[i] * (Math.PI / 180), line.notes[j].alpha * attr_alpha);
					}
				}
				if (line.notes[j].above != 1) f[i] -= 180, line.notes[j].positionX *= -1;
			}
			// const e = ["moveXEvents", "moveYEvents", "rotateEvents", "alphaEvents", "speedEvents"];
		}
		if (show_combo_UI) {
			let old_font = ctx.font;
			ctx.font = "45px 思源黑体";
			ctx.textAlign = "center";
			ctx.fillStyle = "#FFF";
			ctx.fillText(combo, 800, 40);
			ctx.font = "25px 思源黑体";
			ctx.fillText("Autoplay", 800, 80);
			ctx.font = old_font;
		}
	}
}
