/*
音符压缩（牺牲值域，节约内存）
above sFake type alpha size speed 这 6 个属性压成 1 个
positionX 和 yOffset 压成一个

要求必须满足以下条件才能触发压缩：
0 <= alpha <= 255
0 <= size <= 5.11
0 <= speed <= 5.11
-1638 <= positionX <= 1638
-1638 <= yOffset <= 1638
startTime,endTime 中所有数字 <= 1048575
*/



function note_compress(note) { // 尝试压缩，如果无法压缩就返回原来的对象
	if(note.above != 1) note.above = 2;
	if(note.alpha < 0 || note.alpha > 255) return note;
	if(note.size < 0 || note.size > 5.11) return note;
	if(note.speed < 0 || note.speed > 5.11) return note;
	if(Math.abs(note.positionX) > 1638.3 || Math.abs(note.yOffset) > 1638.3) return note;
	if(note.startTime[0] > 1048575 || note.startTime[1] > 1048575 || note.startTime[2] > 1048575) return note;
	if(note.endTime[0] > 1048575 || note.endTime[1] > 1048575 || note.endTime[2] > 1048575) return note;
	if(note.type == 2) { // hold
		let t3 = Math.round(note.startTime[2]);
		let t6 = Math.round(note.endTime[2]);
		var tmp = {
			s: (note.above - 1) | (note.isFake << 1) | ((note.type - 1) << 2) | (note.alpha << 4) | (Math.floor(note.size * 100) << 12) | (Math.floor(note.speed * 100) << 21),
			t1: Math.round(note.startTime[0]) | ((t3 & 1023) << 20),
			t2: Math.round(note.startTime[1]) | ((t3 & 1047552) << 10),
			t4: Math.round(note.endTime[0]) | ((t6 & 1023) << 20),
			t5: Math.round(note.endTime[1]) | ((t6 & 1047552) << 10),
			xy: Math.round((note.positionX + 1638.3) * 10) << 15 | Math.round((note.yOffset + 1638.3) * 10)
		}
	} else {
		let t3 = Math.round(note.startTime[2]);
		var tmp = {
			s: (note.above - 1) | (note.isFake << 1) | ((note.type - 1) << 2) | (note.alpha << 4) | (Math.floor(note.size * 100) << 12) | (Math.floor(note.speed * 100) << 21),
			t1: (Math.round(note.startTime[0])) | ((t3 & 1023) << 20),
			t2: (Math.round(note.startTime[1])) | ((t3 & 1047552) << 10),
			xy: Math.round((note.positionX + 1638.3) * 10) << 15 | Math.round((note.yOffset + 1638.3) * 10),
		}
	}
	if(note.visibleTime != 9999999) tmp.visibleTime = note.visibleTime;
	return tmp;
}
function note_extract(note) {
	if(note.s == undefined) return note;
	if(((note.s >> 2) & 3) + 1 == 2) { // hold
		return {
			"above": (note.s & 1) + 1,
			"isFake": (note.s >> 1) & 1,
			"type": ((note.s >> 2) & 3) + 1,
			"alpha": (note.s >> 4) & 255,
			"size": ((note.s >> 12) & 511) / 100,
			"speed": ((note.s >> 21) & 511) / 100,
			"positionX": (note.xy >> 15) / 10 - 1638,
			"yOffset": (note.xy & 32767) / 10 - 1638,
			"startTime": [note.t1 & 1048575, note.t2 & 1048575, (note.t2 >> 20 << 10) | (note.t1 >> 20)],
			"endTime": [note.t4 & 1048575, note.t5 & 1048575, (note.t5 >> 20 << 10) | (note.t4 >> 20)],
			"visibleTime": note.visibleTime == undefined ? 9999999 : note.visibleTime
		}
	} else {
		return {
			"above": (note.s & 1) + 1,
			"isFake": (note.s >> 1) & 1,
			"type": ((note.s >> 2) & 3) + 1,
			"alpha": (note.s >> 4) & 255,
			"size": ((note.s >> 12) & 511) / 100,
			"speed": ((note.s >> 21) & 511) / 100,
			"positionX": (note.xy >> 15) / 10 - 1638,
			"yOffset": (note.xy & 32767) / 10 - 1638,
			"startTime": [note.t1 & 1048575, note.t2 & 1048575, (note.t2 >> 20 << 10) | (note.t1 >> 20)],
			"endTime": [note.t1 & 1048575, note.t2 & 1048575, (note.t2 >> 20 << 10) | (note.t1 >> 20)],
			"visibleTime": note.visibleTime == undefined ? 9999999 : note.visibleTime
		}
	}
}
