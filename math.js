function gcd(a, b) {
	return a % b == 0 ? b : gcd(b % a, a);
}
function cmp(a, b) { // 判断 a<=b
	return (a[0] * a[2] + a[1]) * b[2] <= (b[0] * b[2] + b[1]) * a[2];
}
function cmp2(a, b) { // 判断 a<b
	return (a[0] * a[2] + a[1]) * b[2] < (b[0] * b[2] + b[1]) * a[2];
}
function add(a, b) {
	let x = (a[0] * a[2] + a[1]) * b[2] + (b[0] * b[2] + b[1]) * a[2];
	let y = a[2] * b[2];
	if (x != 0) {
		let z = gcd(x, y);
		x /= z, y /= z;
	}
	return [Math.floor(x / y), x % y, y];
}
function sub(a, b) {
	let x = (a[0] * a[2] + a[1]) * b[2] - (b[0] * b[2] + b[1]) * a[2];
	let y = a[2] * b[2];
	if (x != 0) {
		let z = gcd(x, y);
		x /= z, y /= z;
	}
	return [Math.floor(x / y), x % y, y];
}
function div(a, b) { // 带分数除以带分数，返回小数
	return (a[0] + a[1] / a[2]) / (b[0] + b[1] / b[2]);
}
function calcease(t, x) { // 类型，比值（0~1）
	function easeOutBounce(x) {
		const n1 = 7.5625;
		const d1 = 2.75;

		if (x < 1 / d1) {
			return n1 * x * x;
		} else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
		} else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
		} else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
		}
	}
	switch (parseInt(t)) { // 计算不同的缓动函数
		case 1: return x;
		case 2: return Math.sin((x * Math.PI) / 2);
		case 3: return 1 - Math.cos((x * Math.PI) / 2);
		case 4: return 1 - (1 - x) * (1 - x);
		case 5: return x * x;
		case 6: return -(Math.cos(Math.PI * x) - 1) / 2;
		case 7: return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
		case 8: return 1 - Math.pow(1 - x, 3);
		case 9: return x * x * x;
		case 10: return 1 - Math.pow(1 - x, 4);
		case 11: return x * x * x * x;
		case 12: return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
		case 13: return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
		case 14: return 1 - Math.pow(1 - x, 5);
		case 15: return x * x * x * x * x;
		case 16: return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
		case 17: return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
		case 18: return Math.sqrt(1 - Math.pow(x - 1, 2));
		case 19: return 1 - Math.sqrt(1 - Math.pow(x, 2));
		case 20: return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
		case 21: return 2.70158 * x * x * x - 1.70158 * x * x;
		case 22: return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
		case 23: return x < 0.5 ? (Math.pow(2 * x, 2) * ((2.5949095 + 1) * 2 * x - 2.5949095)) / 2 : (Math.pow(2 * x - 2, 2) * ((2.5949095 + 1) * (x * 2 - 2) + 2.5949095) + 2) / 2;
		case 24: return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
		case 25: return x === 0 ? 0 : x === 1 ? 1 : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * (2 * Math.PI) / 3);
		case 26: return easeOutBounce(x);
		case 27: return 1 - easeOutBounce(1 - x);
		case 28: return x < 0.5 ? (1 - easeOutBounce(1 - 2 * x)) / 2 : (1 + easeOutBounce(2 * x - 1)) / 2;
	}
}

function is_beat(e) {
	return e.length == 3 && !isNaN(e[0]) && !isNaN(e[1]) && !isNaN(e[2]);
}
function beat_to_sec(beat) {
	let f = (a => a[0] + a[1] / a[2]);
	if (Array.isArray(beat)) beat = f(beat);
	if (bpm.length == 1) return 60 / bpm[0].bpm * beat; // bpm 只有一种的时候，就不需要使用复杂的逻辑了，提高效率
	let sec = 0;
	for (let i = 0; i < bpm.length; i++) {
		if (i == bpm.length - 1 || beat < f(bpm[i + 1].startTime)) {
			sec += 60 / bpm[i].bpm * (beat - f(bpm[i].startTime))
			return sec;
		} else {
			sec += 60 / bpm[i].bpm * (f(bpm[i + 1].startTime) - f(bpm[i].startTime))
		}
	}
}
function sec_to_beat(sec) {
	let f = (a => a[0] + a[1] / a[2]);
	if (bpm.length == 1) return sec * bpm[0].bpm / 60; // bpm 只有一种的时候，就不需要使用复杂的逻辑了，提高效率
	let beat = 0;
	for (let i = 0; i < bpm.length; i++) {
		let totsec = i == bpm.length - 1 ? Infinity : 60 / bpm[i].bpm * f(sub(bpm[i + 1].startTime, bpm[i].startTime));
		if (sec < totsec) {
			beat += sec * bpm[i].bpm / 60;
			return beat;
		} else {
			sec -= totsec;
			beat = bpm[i + 1].startTime[0] + bpm[i + 1].startTime[1] / bpm[i + 1].startTime[2];
		}
	}
}
