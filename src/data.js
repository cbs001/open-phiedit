window.$ = (e) => {
	return document.getElementById(e);
}



function new_empty_data() {
	return {
		"BPMList": [
			{
				"bpm": 100.0,
				"startTime": [0, 0, 1]
			}
		],
		"META": {
			"RPEVersion": 150,
			"background": "",
			"charter": "",
			"composer": "",
			"duration": 0,
			"id": "",
			"illustration": "",
			"level": "0",
			"name": "",
			"offset": 0,
			"song": ""
		},
		"chartTime": 0,
		"judgeLineGroup": ["Default"],
		"judgeLineList": [],
		"multiLineString": "",
		"multiScale": 1.0
	}
}
function new_judge_line() {
	return {
		"Group": 0,
		"Name": "Untitled",
		"Texture": "line.png",
		"alphaControl": [
			{
				"alpha": 1.0,
				"easing": 1,
				"x": 0.0
			},
			{
				"alpha": 1.0,
				"easing": 1,
				"x": 9999999.0
			}
		],
		"anchor": [0.5, 0.5],
		"bpmfactor": 1.0,
		"eventLayers": [
			{
				"alphaEvents": [
					{
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": 0,
						"endTime": [1, 0, 1],
						"linkgroup": 0,
						"start": 0,
						"startTime": [0, 0, 1]
					}
				],
				"moveXEvents": [
					{
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": 0.0,
						"endTime": [1, 0, 1],
						"linkgroup": 0,
						"start": 0.0,
						"startTime": [0, 0, 1]
					}
				],
				"moveYEvents": [
					{
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": 0.0,
						"endTime": [1, 0, 1],
						"linkgroup": 0,
						"start": 0.0,
						"startTime": [0, 0, 1]
					}
				],
				"rotateEvents": [
					{
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": 0.0,
						"endTime": [1, 0, 1],
						"linkgroup": 0,
						"start": 0.0,
						"startTime": [0, 0, 1]
					}
				],
				"speedEvents": [
					{
						"end": 5.0,
						"endTime": [1, 0, 1],
						"linkgroup": 0,
						"start": 5.0,
						"startTime": [0, 0, 1]
					}
				]
			}
		],
		"extended": {
			"inclineEvents": [
				{
					"bezier": 0,
					"bezierPoints": [0.0, 0.0, 0.0, 0.0],
					"easingLeft": 0.0,
					"easingRight": 1.0,
					"easingType": 0,
					"end": 0.0,
					"endTime": [1, 0, 1],
					"linkgroup": 0,
					"start": 0.0,
					"startTime": [0, 0, 1]
				}
			]
		},
		"father": -1,
		"isCover": 1,
		"isGif": false,
		"notes": [],
		"numOfNotes": 0,
		"posControl": [
			{
				"easing": 1,
				"pos": 1.0,
				"x": 0.0
			},
			{
				"easing": 1,
				"pos": 1.0,
				"x": 9999999.0
			}
		],
		"sizeControl": [
			{
				"easing": 1,
				"size": 1.0,
				"x": 0.0
			},
			{
				"easing": 1,
				"size": 1.0,
				"x": 9999999.0
			}
		],
		"skewControl": [
			{
				"easing": 1,
				"skew": 0.0,
				"x": 0.0
			},
			{
				"easing": 1,
				"skew": 0.0,
				"x": 9999999.0
			}
		],
		"yControl": [
			{
				"easing": 1,
				"x": 0.0,
				"y": 1.0
			},
			{
				"easing": 1,
				"x": 9999999.0,
				"y": 1.0
			}
		],
		"zOrder": 0
	};
}



// 格式转换
// ============================================================================================
function official_to_rpe(off) {
	console.log(off);
	let res = new_empty_data();
	res.META.offset = off.offset;
	res.BPMList[0].bpm = off.judgeLineList[0].bpm;
	for (let i = 0; i < off.judgeLineList.length; i++) {
		let line = new_judge_line();
		line.bpmfactor = off.judgeLineList[i].bpm / off.judgeLineList[0].bpm;
		for (let j in line.eventLayers[0]) line.eventLayers[0][j].length = 0;
		for (let j of off.judgeLineList[i].judgeLineMoveEvents) {
			let st = j.startTime * 1.875 / 60;
			let ed = j.endTime * 1.875 / 60;
			if (off.formatVersion == 1) {
				line.eventLayers[0].moveXEvents.push({
					"bezier": 0,
					"bezierPoints": [0.0, 0.0, 0.0, 0.0],
					"easingLeft": 0.0,
					"easingRight": 1.0,
					"easingType": 1,
					"end": -675 + Math.floor(j.end / 1000) / 880 * 1300,
					"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
					"linkgroup": 0,
					"start": -675 + Math.floor(j.start / 1000) / 880 * 1300,
					"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96]
				})
				line.eventLayers[0].moveYEvents.push({
					"bezier": 0,
					"bezierPoints": [0.0, 0.0, 0.0, 0.0],
					"easingLeft": 0.0,
					"easingRight": 1.0,
					"easingType": 1,
					"end": -450 + (j.end % 1000) / 520 * 900,
					"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
					"linkgroup": 0,
					"start": -450 + (j.start % 1000) / 520 * 900,
					"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96]
				})
			} else {
				line.eventLayers[0].moveXEvents.push({
					"bezier": 0,
					"bezierPoints": [0.0, 0.0, 0.0, 0.0],
					"easingLeft": 0.0,
					"easingRight": 1.0,
					"easingType": 1,
					"end": -675 + j.end * 1300,
					"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
					"linkgroup": 0,
					"start": -675 + j.start * 1300,
					"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96]
				})
				line.eventLayers[0].moveYEvents.push({
					"bezier": 0,
					"bezierPoints": [0.0, 0.0, 0.0, 0.0],
					"easingLeft": 0.0,
					"easingRight": 1.0,
					"easingType": 1,
					"end": -450 + j.end2 * 900,
					"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
					"linkgroup": 0,
					"start": -450 + j.start2 * 900,
					"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96]
				})
			}
		}
		for (let j of off.judgeLineList[i].speedEvents) {
			let st = j.startTime * 1.875 / 60;
			let ed = j.endTime * 1.875 / 60;
			line.eventLayers[0].speedEvents.push({
				"end": j.value * 4.5,
				"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
				"linkgroup": 0,
				"start": j.value * 4.5,
				"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96]
			})
		}
		for (let j of off.judgeLineList[i].judgeLineRotateEvents) {
			let st = j.startTime * 1.875 / 60;
			let ed = j.endTime * 1.875 / 60;
			line.eventLayers[0].rotateEvents.push({
				"bezier": 0,
				"bezierPoints": [0.0, 0.0, 0.0, 0.0],
				"easingLeft": 0.0,
				"easingRight": 1.0,
				"easingType": 1,
				"end": -j.end,
				"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
				"linkgroup": 0,
				"start": -j.start,
				"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96]
			})
		}
		for (let j of off.judgeLineList[i].judgeLineDisappearEvents) {
			let st = j.startTime * 1.875 / 60;
			let ed = j.endTime * 1.875 / 60;
			line.eventLayers[0].alphaEvents.push({
				"bezier": 0,
				"bezierPoints": [0.0, 0.0, 0.0, 0.0],
				"easingLeft": 0.0,
				"easingRight": 1.0,
				"easingType": 1,
				"end": j.end * 255,
				"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
				"linkgroup": 0,
				"start": j.start * 255,
				"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96]
			})
		}
		for (let tmp of [[1, off.judgeLineList[i].notesAbove], [2, off.judgeLineList[i].notesBelow]]) {
			for (let j of tmp[1]) {
				let st = j.time * 1.875 / 60;
				let x = j.positionX * 75;
				if (j.type == 3) {
					let ed = st + j.holdTime * 1.875 / 60;
					line.notes.push(note_compress({
						"above": tmp[0],
						"alpha": 255,
						"endTime": [Math.floor(ed), Math.floor((ed % 1) * 96), 96],
						"isFake": 0,
						"positionX": x,
						"size": 1.0,
						"speed": 1.0,
						"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96],
						"type": 2,
						"visibleTime": 9999999.0,
						"yOffset": 0.0
					}));
				} else {
					line.notes.push(note_compress({
						"above": tmp[0],
						"alpha": 255,
						"endTime": [Math.floor(st), Math.floor((st % 1) * 96), 96],
						"isFake": 0,
						"positionX": x,
						"size": 1.0,
						"speed": 1.0,
						"startTime": [Math.floor(st), Math.floor((st % 1) * 96), 96],
						"type": [0, 1, 4, 2, 3][j.type],
						"visibleTime": 9999999.0,
						"yOffset": 0.0
					}));
				}
			}
		}
		res.judgeLineList.push(line);
	}
	return res;
}
function pec_to_rpe(pec) {
	let res = new_empty_data();
	console.log(pec, res);
	res.BPMList.length = 0;
	let key = "";
	let op = "", args = [];
	for (let i = 0; i < pec.length; i++) {
		let char = pec[i];
		if (typeof char == "number") char = String.fromCharCode(char);
		if (char == " " || char == "\n" || char == "\r") {
			if (key != "") {
				if (/[a-z]/.test(key[0])) op = key, args.length = 0;
				else args.push(key);
				key = "";

				function tob(a) {
					let x = Math.floor((a % 1) * 1000000);
					let y = 1000000;
					let z = gcd(x, y);
					return [Math.floor(a), x / z, y / z];
				}
				function add_line(n) {
					while (res.judgeLineList.length <= n) {
						let line = new_judge_line();
						for (let j in line.eventLayers[0]) line.eventLayers[0][j].length = 0;
						res.judgeLineList.push(line);
					}
				}
				if (op == "bp" && args.length == 2) {
					res.BPMList.push({
						startTime: tob(Number(args[0])),
						bpm: Number(args[1])
					});
				} else if (op == "cp" && args.length == 4) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].eventLayers[0].moveXEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": Number(args[2]) / 2048 * 1350 - 675,
						"endTime": tob(Number(args[1])),
						"linkgroup": 0,
						"start": Number(args[2]) / 2048 * 1350 - 675,
						"startTime": tob(Number(args[1]))
					})
					res.judgeLineList[id].eventLayers[0].moveYEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": Number(args[3]) / 1400 * 900 - 450,
						"endTime": tob(Number(args[1])),
						"linkgroup": 0,
						"start": Number(args[3]) / 1400 * 900 - 450,
						"startTime": tob(Number(args[1]))
					})
				} else if (op == "cm" && args.length == 6) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].eventLayers[0].moveXEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": Number(args[5]),
						"end": Number(args[3]) / 2048 * 1350 - 675,
						"endTime": tob(Number(args[2])),
						"linkgroup": 0,
						"start": renderer.basic_getval(res.judgeLineList[id].eventLayers[0].moveXEvents, tob(Number(args[1]))),
						"startTime": tob(Number(args[1]))
					})
					res.judgeLineList[id].eventLayers[0].moveYEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": Number(args[5]),
						"end": Number(args[4]) / 1400 * 900 - 450,
						"endTime": tob(Number(args[2])),
						"linkgroup": 0,
						"start": renderer.basic_getval(res.judgeLineList[id].eventLayers[0].moveYEvents, tob(Number(args[1]))),
						"startTime": tob(Number(args[1]))
					})
				} else if (op == "cd" && args.length == 3) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].eventLayers[0].rotateEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": Number(args[2]),
						"endTime": tob(Number(args[1])),
						"linkgroup": 0,
						"start": Number(args[2]),
						"startTime": tob(Number(args[1]))
					})
				} else if (op == "cr" && args.length == 5) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].eventLayers[0].rotateEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": Number(args[4]),
						"end": Number(args[3]),
						"endTime": tob(Number(args[2])),
						"linkgroup": 0,
						"start": renderer.basic_getval(res.judgeLineList[id].eventLayers[0].rotateEvents, tob(Number(args[1]))),
						"startTime": tob(Number(args[1]))
					})
				} else if (op == "ca" && args.length == 3) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].eventLayers[0].alphaEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": Number(args[2]),
						"endTime": tob(Number(args[1])),
						"linkgroup": 0,
						"start": Number(args[2]),
						"startTime": tob(Number(args[1]))
					})
				} else if (op == "cf" && args.length == 4) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].eventLayers[0].alphaEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": Number(args[3]),
						"endTime": tob(Number(args[2])),
						"linkgroup": 0,
						"start": renderer.basic_getval(res.judgeLineList[id].eventLayers[0].alphaEvents, tob(Number(args[1]))),
						"startTime": tob(Number(args[1]))
					})
				} else if (op == "cv" && args.length == 3) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].eventLayers[0].speedEvents.push({
						"bezier": 0,
						"bezierPoints": [0.0, 0.0, 0.0, 0.0],
						"easingLeft": 0.0,
						"easingRight": 1.0,
						"easingType": 1,
						"end": Number(args[2]) / 1.7,
						"endTime": tob(Number(args[1])),
						"linkgroup": 0,
						"start": Number(args[2]) / 1.7,
						"startTime": tob(Number(args[1]))
					})
				} else if (op == "n2" && args.length == 10) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].notes.push(note_compress({
						"above": Number(args[4]),
						"alpha": 255,
						"endTime": tob(Number(args[2])),
						"isFake": Number(args[5]),
						"positionX": Number(args[3]) / 1024 * 675,
						"size": Number(args[9]),
						"speed": Number(args[7]),
						"startTime": tob(Number(args[1])),
						"type": 2,
						"visibleTime": 9999999.0,
						"yOffset": 0.0
					}));
				} else if (op.length == 2 && op[0] == "n" && args.length == 9) {
					let id = Number(args[0])
					add_line(id);
					res.judgeLineList[id].notes.push(note_compress({
						"above": Number(args[3]),
						"alpha": 255,
						"endTime": tob(Number(args[1])),
						"isFake": Number(args[4]),
						"positionX": Number(args[2]) / 1024 * 675,
						"size": Number(args[8]),
						"speed": Number(args[6]),
						"startTime": tob(Number(args[1])),
						"type": Number(op[1]),
						"visibleTime": 9999999.0,
						"yOffset": 0.0
					}));
				}
			}
		} else {
			key += char;
		}
	}
	return res;
}
// 加载与保存
// ============================================================================================
function large_json_stringify(obj, write) {
	if (obj === null) write("null");
	else if (obj === undefined) write("undefined");
	else if (typeof obj === "object") {
		if (obj.s) {
			obj = note_extract(obj); // 自动解压音符
		}
		let ans = [];
		if (Array.isArray(obj)) {
			write("[");
			for (let i = 0; i < obj.length; i++) {
				if (i) write(",");
				large_json_stringify(obj[i], write);
			}
			write("]");
		} else {
			write("{");
			let f = 1;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (f == 1) f = 0;
					else write(",");
					write("\"" + key + "\":");
					large_json_stringify(obj[key], write);
				}
			}
			write("}");
		}
		return ans;
	} else {
		if (typeof obj == "string") write("\"" + obj + "\"");
		else write(obj.toString());
	}
}
async function FileDownload(content, filename) {
	const eleLink = document.createElement('a');
	eleLink.download = filename;
	eleLink.style.display = 'none';
	const blob = new Blob([content]);
	eleLink.href = URL.createObjectURL(blob);
	document.body.appendChild(eleLink);
	eleLink.click();
	document.body.removeChild(eleLink);
}
function fix() {
	for (let i = 0; i < all_data.judgeLineList.length; i++) {
		let line = all_data.judgeLineList[i];
		if (line.extended == undefined) line.extended = {};
		if (line.anchor == undefined) line.anchor = [0.5, 0.5];
		if (line.bpmfactor == undefined) line.bpmfactor = 1.0;
		if (line.notes == undefined) line.notes = [];
		for (let j = 0; j < line.eventLayers.length; j++) {
			for (let k in line.eventLayers[j]) {
				let evs = line.eventLayers[j][k];
				for (let p = 0; p < evs.length; p++) {
					if (evs[p].easingLeft == undefined) evs[p].easingLeft = 0;
					if (evs[p].easingRight == undefined) evs[p].easingRight = 1;
				}
			}
		}
	}
}
function large_json_parse(e) {
	if (e.str == undefined) return large_json_parse({ str: e, i: 0 });
	while (e.str[e.i] == 32 || e.str[e.i] == 9 || e.str[e.i] == 10 || e.str[e.i] == 13) e.i++;
	if (e.str[e.i] === 123) { // object
		e.i++;
		var result = {};
		while (e.str[e.i] !== 125) {
			if (e.i >= e.str.length) throw new Error("JSON 格式错误：大括号未闭合");
			var key = large_json_parse(e);
			e.i++;
			var value = large_json_parse(e);
			result[key] = value;
			if (e.str[e.i] === 44) e.i++; // 逗号
		}
		e.i++;
		if (result.type) {
			result = note_compress(result); // 自动压缩音符
		}
		return result;
	} else if (e.str[e.i] === 91) { // array
		e.i++;
		var result = [];
		while (e.str[e.i] !== 93) {
			if (e.i >= e.str.length) throw new Error("JSON 格式错误：中括号未闭合");
			result.push(large_json_parse(e));
			if (e.str[e.i] === 44) e.i++;  // 逗号
		}
		e.i++;
		return result;
	} else if (e.str[e.i] === 110) {  // null
		e.i += 4;
		return null;
	} else if (e.str[e.i] === 116) { // true
		e.i += 4;
		return true;
	} else if (e.str[e.i] === 102) { // false
		e.i += 5;
		return false;
	} else if (e.str[e.i] === 34) { // string
		var result = "";
		e.i++; // 跳过双引号
		while (e.str[e.i] != 34) result += String.fromCharCode(e.str[e.i++])
		e.i++;
		return result;
	} else { // number
		var numStr = "";
		while (45 <= e.str[e.i] && e.str[e.i] <= 57) numStr += String.fromCharCode(e.str[e.i++]);
		return parseFloat(numStr);
	}
}
function toa(s) {
	let a = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) {
		a[i] = s.charCodeAt(i);
	}
	return a
}

$("m-load").addEventListener('click', () => {
	var fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.id = "temp-input";
	fileInput.accept = '*.json'; // 限制只能选择 json 文件
	fileInput.click();

	// 监听文件选择事件
	fileInput.onchange = function (e) {
		var files = e.target.files;
		if (files.length) {
			console.log("加载成功, 类型：" + files[0].type);
			if (files[0].type.includes("audio") || files[0].type == "video/ogg") {
				$("music-player").src = URL.createObjectURL(files[0]);
			} else {
				function init() {
					/*
					notes，evs 都是 all_data 中的引用
					*/
					change_line(0);
					fix();
					bpm = all_data.BPMList;
					settingscontrol.load(); // 加载基本设置

					let sum = 0;
					for (let i = 0; i < all_data.judgeLineList.length; i++)
						if (all_data.judgeLineList[i].notes)
							sum += all_data.judgeLineList[i].notes.length;
					if (sum >= 5000) {
						settingscontrol.settings.player = 0;
						window.alert("谱面物量较多，已自动关闭预览功能");
					}
				}
				var reader = new FileReader();
				if (files[0].size > 500 * 1024 * 1024) {
					if (window.prompt("谱面文件超过 500 MB，继续读取可能出现问题，是否继续？（继续输入 Y）").trim() == "Y") {
						let st = performance.now();
						reader.onload = function (e) {
							let data = new Uint8Array(e.target.result)
							try {
								// console.log(data);
								let json = large_json_parse(data);
								if (json.formatVersion) {
									console.log("尝试以 official 格式读取");
									all_data = official_to_rpe(json)
								} else {
									all_data = json;
								}
								console.log("用时：", performance.now() - st);
								init();
							} catch (error) {
								try {
									console.log("尝试以 pec 格式读取");
									all_data = pec_to_rpe(data);
								} catch (error) {
									console.log(error)
									window.alert("解析错误");
								}
							}
						};
						reader.readAsArrayBuffer(files[0]);
					}
				} else {
					reader.onload = function (e) {
						try {
							json = JSON.parse(e.target.result);
							if (json.formatVersion) {
								console.log("尝试以 official 格式读取");
								all_data = official_to_rpe(json)
							} else {
								all_data = json;
								for (let i = 0; i < all_data.judgeLineList.length; i++) {
									if (all_data.judgeLineList[i].notes) {
										for (let j = 0; j < all_data.judgeLineList[i].notes.length; j++) {
											all_data.judgeLineList[i].notes[j] = note_compress(all_data.judgeLineList[i].notes[j]);
										}
									}
								}
							}
							console.log(all_data);
							console.log(all_data);
							init();
						} catch (error) {
							try {
								console.log(error);
								let str = e.target.result, ispec;
								for (let i = 0; i < str.length; i++) {
									if (/[a-z]/.test(str[i])) {
										ispec = 1;
										break;
									}
								}
								if (ispec) {
									console.log("尝试以 pec 格式读取");
									all_data = pec_to_rpe(str);
								} else {
									console.log("尝试以 que 格式读取");
									let a = str.split('\n'), n = parseInt(a[0]); // a 表示每一行的字符串
									all_data = new_empty_data();
									all_data.judgeLineList.push(new_judge_line());
									for (let i = 1; i <= n; i++) {
										let tmp = a[i].split(' ');
										let type = parseInt(tmp[0]);
										let st = parseInt(tmp[1]) / 66.6 * (bpm / 60);
										let speed = parseInt(tmp[2]);
										let x = parseInt(tmp[tmp.length - 1]);
										let ed = type === 3 ? st + Math.floor(parseInt(tmp[3]) / 66.6 * (bpm / 60)) : st;
										let note = {
											type: type,
											startTime: [Math.floor(st), Math.round((st % 1) * 16), 16],
											positionX: (x - 1) * (1350 / shu) - 675,
											endTime: [Math.floor(ed), Math.round((ed % 1) * 16), 16]
										};
										all_data.judgeLineList[0].notes.push(note);
									}
								}
								init();
							} catch (error) {
								console.log(error);
								window.alert("解析错误");
							}
						}
					};
					reader.readAsText(files[0]);
				}

			}
		}
	};
});
$("m-save").addEventListener('click', () => {
	if (in_download == 0) {
		in_download = 1;
		$("downloading").style.display = "block";
		setTimeout(() => {
			for (let i = 0; i < all_data.judgeLineList.length; i++) {
				if (all_data.judgeLineList[i].notes == undefined) all_data.judgeLineList[i].numOfNotes = 0;
				else all_data.judgeLineList[i].numOfNotes = all_data.judgeLineList[i].notes.length;
			}

			if (window.showSaveFilePicker == undefined) {
				for (let i = 0; i < all_data.judgeLineList.length; i++) {
					for (let j = 0; j < all_data.judgeLineList[i].notes.length; j++) {
						all_data.judgeLineList[i].notes[j] = note_extract(all_data.judgeLineList[i].notes[j]);
					}
				}
				FileDownload(JSON.stringify(all_data), "chart.json");
			} else {
				// 流式保存
				window.showSaveFilePicker({ suggestedName: "chart.json" })
					.then(handle => handle.createWritable())
					.then(stream => {
						// console.log(stream);
						let cache = "";
						large_json_stringify(all_data, (s) => {
							if (cache.length + s.length <= 1e7) cache += s;
							else stream.write(cache), cache = s;
						});
						stream.write(cache);
						stream.close();
					});
			}
			in_download = 0;
			$("downloading").style.display = "none";
		}, 0);
	}
});
$("m-save2").addEventListener('click', () => {
	if (in_download == 0) {
		in_download = 1;
		$("downloading").style.display = "block";
		let n = 0, que = [];
		for (let i = 0; i < all_data.judgeLineList.length; i++) {
			n += all_data.judgeLineList[i].notes.length;
		}
		for (let i = 0; i < all_data.judgeLineList.length; i++) {
			for (let j = 0; j < all_data.judgeLineList[i].notes.length; j++) {
				let tmp = note_extract(all_data.judgeLineList[i].notes[j]);
				let a = {};
				if (tmp.type == 1 || tmp.type == 3) a.type = 1;
				else if (tmp.type == 4) a.type = 2;
				else a.type = 3;
				a.st = Math.round(((tmp.startTime[0] + tmp.startTime[1] / tmp.startTime[2]) / (bpm / 60)) * 66.6);
				a.x = Math.round((tmp.positionX + 675) / (1350 / shu)) + 1;
				a.speed = 50;
				a.ed = Math.round(((tmp.endTime[0] + tmp.endTime[1] / tmp.endTime[2]) / (bpm / 60)) * 66.6);
				que.push(a);
			}
		}
		que.sort((a, b) => a.st - b.st);
		let str = n + "\n";
		for (let i = 0; i < que.length; i++) str += que[i].type + " " + que[i].st + " " + que[i].speed + (que[i].type == 3 ? " " + (que[i].ed - que[i].st) : "") + " " + que[i].x + "\n";
		FileDownload(str, "chart.que");
		in_download = 0;
		$("downloading").style.display = "none";
	}
});