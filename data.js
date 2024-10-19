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

// 加载与保存
// ============================================================================================
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
			var reader = new FileReader();
			reader.onload = function (e) {
				// console.log(e);
				try {
					all_data = JSON.parse(e.target.result);
				} catch (error) {
					let a = e.target.result.split('\n'), n = parseInt(a[0]); // a 表示每一行的字符串
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
				/*
				notes，evs 都是 all_data 中的引用
				*/
				notes = all_data.judgeLineList[0].notes;
				notecontrol.update();
				evs = all_data.judgeLineList[0].eventLayers;
				$("lines").value = 0;
				selection = [];
				settingscontorl.load(); // 加载基本设置
			};
			reader.readAsText(files[0]);
		}
	};
});
$("m-save").addEventListener('click', () => {
	if (in_download == 0) {
		in_download = 1;
		$("downloading").style.display = "block";
		for (let i = 0; i < all_data.judgeLineList.length; i++) {
			all_data.judgeLineList[i].numOfNotes = all_data.judgeLineList[i].notes.length;
		}
		FileDownload(JSON.stringify(all_data), "chart.json");
		in_download = 0;
		$("downloading").style.display = "none";
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
				let tmp = all_data.judgeLineList[i].notes[j];
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
