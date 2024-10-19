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
